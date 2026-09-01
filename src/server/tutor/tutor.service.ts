import "server-only";

import { tutorRequestSchema } from "@/lib/validations/tutor";
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
import {
  createAssistantMessage,
  createConversation,
  createUserMessage,
  findRecentDuplicateUserMessage,
  loadRecentMessagesForPrompt,
  touchConversation,
} from "@/server/tutor/tutor.repository";
import {
  checkTutorRateLimit,
  getDuplicateMessageCutoff,
} from "@/server/tutor/tutor-rate-limit.service";
import {
  buildFallbackRefusalResponse,
  extractJsonFromModelText,
  filterRelatedContentToGrounding,
  prepareTutorResponseForStorageAndClient,
  sanitizeTutorUserMessage,
  tutorUserFacingErrors,
  validateTutorResponsePayload,
} from "@/server/tutor/tutor-safety";
import type { SendTutorMessageResult, TutorMessageDto } from "@/types/tutor";
import type { TutorAiProvider } from "@/server/tutor/ai/provider";

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

  if (conversationId) {
    const access = await ensureTutorConversationAccess(conversationId, input.userId);
    if ("error" in access) {
      return { error: access.error };
    }

    const duplicate = await findRecentDuplicateUserMessage(
      conversationId,
      userMessage,
      getDuplicateMessageCutoff(),
    );
    if (duplicate) {
      return { error: "Please wait a moment before sending the same message again." };
    }
  } else {
    const conversation = await createConversation(
      input.userId,
      deriveConversationTitle(userMessage),
    );
    conversationId = conversation.id;
  }

  const savedUserMessage = await createUserMessage(conversationId, userMessage);
  await touchConversation(conversationId, input.userId);

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

  const jlptLevel = learnerContext.profile.japaneseLevel;
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
  const safeResponse = prepareTutorResponseForStorageAndClient(filtered);

  const savedAssistantMessage = await createAssistantMessage(
    conversationId,
    safeResponse.answer,
    safeResponse,
  );
  await touchConversation(conversationId, input.userId);

  const userMessageDto: TutorMessageDto = {
    id: savedUserMessage.id,
    role: "USER",
    content: savedUserMessage.content,
    createdAt: savedUserMessage.createdAt.toISOString(),
  };

  const assistantMessageDto: TutorMessageDto = {
    id: savedAssistantMessage.id,
    role: "ASSISTANT",
    content: savedAssistantMessage.content,
    createdAt: savedAssistantMessage.createdAt.toISOString(),
    response: safeResponse,
  };

  return {
    ...safeResponse,
    conversationId,
    userMessageId: savedUserMessage.id,
    assistantMessageId: savedAssistantMessage.id,
    userMessage: userMessageDto,
    assistantMessage: assistantMessageDto,
  };
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

  const prompt = buildTutorPrompt({
    learnerContext,
    grounding,
    history,
    userMessage: input.message,
  });

  return {
    learnerContext: JSON.stringify(learnerContext),
    grounding: serializeGroundingForPrompt(grounding),
    history: JSON.stringify(history),
    promptLayers: prompt,
  };
}
