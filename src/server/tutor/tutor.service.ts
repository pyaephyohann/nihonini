import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { TutorResponseInput } from "@/lib/validations/tutor";
import { tutorRequestSchema, type LegacyTutorResponseInput } from "@/lib/validations/tutor";
import { getTutorAiProvider } from "@/server/tutor/ai/openai-compatible.provider";
import {
  deriveConversationTitle,
  ensureTutorConversationAccess,
} from "@/server/tutor/tutor-conversation.service";
import {
  buildTutorGrounding,
  serializeGroundingForPrompt,
} from "@/server/tutor/tutor-grounding.service";
import { buildTutorLearnerContext } from "@/server/tutor/tutor-context.service";
import { buildPromptHistory } from "@/server/tutor/tutor-history";
import { isTutorProviderConfigured, tutorConfig } from "@/server/tutor/tutor-config";
import { buildTutorPrompt } from "@/server/tutor/tutor-prompt";
import { buildTutorRecommendationContext } from "@/server/tutor/recommendation/tutor-recommendation.service";
import { buildTutorOutcomeContext } from "@/server/tutor/outcome/tutor-outcome.service";
import { buildTutorProgressContext } from "@/server/tutor/progress/tutor-progress-context.service";
import { determineCoachingPolicy } from "@/server/tutor/coaching/tutor-coaching-policy";
import {
  buildGuidedPracticeContext,
  buildStalePracticeClarification,
  detectGuidedPracticeState,
  enforcePracticeResponseRules,
  evaluatePracticeAnswer,
} from "@/server/tutor/tutor-practice.service";
import {
  createAssistantMessage,
  createConversation,
  createUserMessage,
  createUserMessageWithDuplicateGuard,
  loadRecentMessagesForPrompt,
  loadRecentMessagesWithJson,
  touchConversation,
} from "@/server/tutor/tutor.repository";
import {
  checkTutorRateLimit,
  getDuplicateMessageCutoff,
  tutorRateLimitErrors,
} from "@/server/tutor/tutor-rate-limit.service";
import {
  buildFallbackRefusalResponse,
  extractJsonFromModelText,
  filterRelatedContentToGrounding,
  filterRecommendationsToTrustedCandidates,
  prepareTutorResponseForClient,
  sanitizeTutorUserMessage,
  tutorUserFacingErrors,
  validateTutorResponsePayload,
} from "@/server/tutor/tutor-safety";
import type { SendTutorMessageResult, TutorMessageDto, TutorResponse } from "@/types/tutor";
import type { TutorAiProvider } from "@/server/tutor/ai/provider";

async function persistAssistantAndBuildResult(input: {
  conversationId: string;
  userId: string;
  savedUserMessage: { id: string; content: string; createdAt: Date };
  fullResponse: TutorResponseInput | import("@/lib/validations/tutor").LegacyTutorResponseInput;
}): Promise<SendTutorMessageResult> {
  const clientResponse = prepareTutorResponseForClient(input.fullResponse) as TutorResponse;

  const savedAssistantMessage = await createAssistantMessage(
    input.conversationId,
    input.fullResponse.answer,
    input.fullResponse as unknown as Prisma.InputJsonValue,
  );
  await touchConversation(input.conversationId, input.userId);

  const userMessageDto: TutorMessageDto = {
    id: input.savedUserMessage.id,
    role: "USER",
    content: input.savedUserMessage.content,
    createdAt: input.savedUserMessage.createdAt.toISOString(),
  };

  const assistantMessageDto: TutorMessageDto = {
    id: savedAssistantMessage.id,
    role: "ASSISTANT",
    content: savedAssistantMessage.content,
    createdAt: savedAssistantMessage.createdAt.toISOString(),
    response: clientResponse,
  };

  return {
    ...clientResponse,
    conversationId: input.conversationId,
    userMessageId: input.savedUserMessage.id,
    assistantMessageId: savedAssistantMessage.id,
    userMessage: userMessageDto,
    assistantMessage: assistantMessageDto,
  };
}

export async function sendTutorMessage(input: {
  userId: string;
  payload: unknown;
  provider?: TutorAiProvider;
}): Promise<SendTutorMessageResult> {
  if (!tutorConfig.enabled) {
    return { error: tutorUserFacingErrors.disabled };
  }

  if (!isTutorProviderConfigured()) {
    return { error: tutorUserFacingErrors.unavailable };
  }

  const parsed = tutorRequestSchema.safeParse(input.payload);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? tutorUserFacingErrors.invalidInput;
    return { error: message };
  }

  const userMessage = sanitizeTutorUserMessage(parsed.data.message);
  if (userMessage.length > tutorConfig.maxInputChars) {
    return { error: tutorUserFacingErrors.tooLong };
  }

  const rateLimit = await checkTutorRateLimit(input.userId);
  if (rateLimit) {
    return { error: rateLimit.error };
  }

  let conversationId = parsed.data.conversationId;
  const isExistingConversation = Boolean(conversationId);

  if (conversationId) {
    const access = await ensureTutorConversationAccess(conversationId, input.userId);
    if ("error" in access) {
      return { error: access.error };
    }
  } else {
    const conversation = await createConversation(
      input.userId,
      deriveConversationTitle(userMessage),
    );
    conversationId = conversation.id;
  }

  let savedUserMessage: {
    id: string;
    content: string;
    createdAt: Date;
  };

  if (isExistingConversation) {
    const guarded = await createUserMessageWithDuplicateGuard({
      conversationId,
      userId: input.userId,
      content: userMessage,
      since: getDuplicateMessageCutoff(),
    });

    if (guarded.status === "duplicate") {
      return { error: tutorRateLimitErrors.duplicateMessage, conversationId };
    }

    if (guarded.status === "not_found") {
      return { error: "Conversation not found." };
    }

    savedUserMessage = guarded.message;
  } else {
    savedUserMessage = await createUserMessage(conversationId, userMessage);
    await touchConversation(conversationId, input.userId);
  }

  const messagesWithJson = await loadRecentMessagesWithJson(conversationId, input.userId);
  if (!messagesWithJson) {
    return {
      error: "Conversation not found.",
      conversationId,
      userMessageId: savedUserMessage.id,
    };
  }

  const historyRows = await loadRecentMessagesForPrompt(
    conversationId,
    input.userId,
    savedUserMessage.id,
  );
  if (!historyRows) {
    return {
      error: "Conversation not found.",
      conversationId,
      userMessageId: savedUserMessage.id,
    };
  }

  const learnerContext = await buildTutorLearnerContext(input.userId);
  if ("error" in learnerContext) {
    return {
      error: learnerContext.error,
      conversationId,
      userMessageId: savedUserMessage.id,
    };
  }

  const practiceState = detectGuidedPracticeState(messagesWithJson, savedUserMessage.id);

  if (practiceState.kind === "stale_answer_attempt") {
    const clarification = buildStalePracticeClarification(practiceState.reason);
    return persistAssistantAndBuildResult({
      conversationId,
      userId: input.userId,
      savedUserMessage,
      fullResponse: clarification,
    });
  }

  const guidedPracticeContext =
    practiceState.kind === "awaiting_answer"
      ? buildGuidedPracticeContext({
          active: practiceState.active,
          evaluation: evaluatePracticeAnswer(practiceState.active, userMessage),
          learnerContext,
        })
      : undefined;

  const recommendationBundle =
    practiceState.kind === "no_active_practice"
      ? await buildTutorRecommendationContext(input.userId, userMessage)
      : null;

  const [progressContext, outcomeContext] =
    practiceState.kind === "no_active_practice"
      ? await Promise.all([
          buildTutorProgressContext(input.userId, userMessage),
          buildTutorOutcomeContext({
            userId: input.userId,
            conversationId,
            userMessage,
          }),
        ])
      : [null, null];

  const jlptLevel = learnerContext.profile.japaneseLevel;
  
  const adaptiveCoachingContext =
    practiceState.kind === "no_active_practice"
      ? determineCoachingPolicy({
          outcomeContext: outcomeContext ?? undefined,
          progressContext: progressContext ?? undefined,
        })
      : null;

  const grounding = await buildTutorGrounding({
    message: userMessage,
    jlptLevel,
  });

  const history = buildPromptHistory(historyRows);
  const prompt = buildTutorPrompt({
    learnerContext,
    grounding,
    history,
    userMessage,
    progressContext: progressContext ?? undefined,
    outcomeContext: outcomeContext ?? undefined,
    adaptiveCoachingContext: adaptiveCoachingContext ?? undefined,
    guidedPracticeContext,
    recommendationContext: recommendationBundle?.context,
  });

  const provider = input.provider ?? getTutorAiProvider();

  let providerText: string;
  try {
    const completion = await provider.complete({
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
      maxOutputTokens: tutorConfig.maxOutputTokens,
      timeoutMs: tutorConfig.timeoutMs,
    });
    providerText = completion.text;
  } catch {
    return {
      error: tutorUserFacingErrors.unavailable,
      conversationId,
      userMessageId: savedUserMessage.id,
    };
  }

  const extracted = extractJsonFromModelText(providerText);
  let validated = validateTutorResponsePayload(extracted);

  if (!validated) {
    validated = buildFallbackRefusalResponse();
  }

  const filtered = filterRelatedContentToGrounding(validated, grounding);

  let afterRecommendation: TutorResponseInput | LegacyTutorResponseInput = filtered;
  if (filtered.type === "RECOMMENDATION") {
    if (recommendationBundle) {
      afterRecommendation = filterRecommendationsToTrustedCandidates(
        filtered,
        recommendationBundle.context.trustedCandidates,
      );
    } else {
      afterRecommendation = buildFallbackRefusalResponse();
    }
  }

  const enforced = enforcePracticeResponseRules(afterRecommendation);
  const fullResponse = enforced ?? buildFallbackRefusalResponse();

  const responseWithContext = {
    ...fullResponse,
    ...(progressContext && { progressContext }),
    ...(outcomeContext && { outcomeContext }),
    ...(adaptiveCoachingContext && { adaptiveCoachingContext }),
  };

  return persistAssistantAndBuildResult({
    conversationId,
    userId: input.userId,
    savedUserMessage,
    fullResponse: responseWithContext as unknown as typeof fullResponse,
  });
}

export async function buildTutorDebugSnapshot(input: {
  userId: string;
  message: string;
  conversationId?: string;
}): Promise<{
  learnerContext: string;
  grounding: string;
  promptLayers: { system: string; user: string };
  history: string;
}> {
  const learnerContext = await buildTutorLearnerContext(input.userId);
  if ("error" in learnerContext) {
    throw new Error(learnerContext.error);
  }

  const jlptLevel = learnerContext.profile.japaneseLevel;
  const grounding = await buildTutorGrounding({
    message: input.message,
    jlptLevel,
  });

  let history = buildPromptHistory([]);
  if (input.conversationId) {
    const rows = await loadRecentMessagesForPrompt(input.conversationId, input.userId, "");
    if (rows) {
      history = buildPromptHistory(rows);
    }
  }

  const [progressContext, outcomeContext] = input.conversationId
    ? await Promise.all([
        buildTutorProgressContext(input.userId, input.message),
        buildTutorOutcomeContext({
          userId: input.userId,
          conversationId: input.conversationId,
          userMessage: input.message,
        }),
      ])
    : [null, null];

  const prompt = buildTutorPrompt({
    learnerContext,
    grounding,
    history,
    userMessage: input.message,
    progressContext: progressContext ?? undefined,
    outcomeContext: outcomeContext ?? undefined,
    adaptiveCoachingContext: (progressContext || outcomeContext) ? determineCoachingPolicy({
      outcomeContext: outcomeContext ?? undefined,
      progressContext: progressContext ?? undefined,
    }) ?? undefined : undefined,
  });

  return {
    learnerContext: JSON.stringify(learnerContext),
    grounding: serializeGroundingForPrompt(grounding),
    history: JSON.stringify(history),
    promptLayers: prompt,
  };
}
