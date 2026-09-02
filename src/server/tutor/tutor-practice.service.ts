import "server-only";

import {
  legacyPracticeResponseSchema,
  tutorPracticeDifficultyValues,
  type LegacyTutorResponseInput,
  type TutorPracticeDifficulty,
  type TutorPracticeQuestionType,
  type TutorResponseInput,
} from "@/lib/validations/tutor";
import { validateTutorResponsePayload } from "@/server/tutor/tutor-safety";
import type { TutorLearnerContext } from "@/types/tutor";

export type ActivePracticeQuestion = {
  messageId: string;
  question: string;
  questionType: TutorPracticeQuestionType;
  difficulty: TutorPracticeDifficulty;
  choices?: string[];
  expectedAnswer: string;
};

export type GuidedPracticeState =
  | { kind: "no_active_practice" }
  | { kind: "awaiting_answer"; active: ActivePracticeQuestion }
  | { kind: "stale_answer_attempt"; reason: string };

export type PracticeEvaluation = {
  isCorrect: boolean;
  normalizedLearnerAnswer: string;
  normalizedExpectedAnswer: string;
};

export type GuidedPracticeContext = {
  mode: "PRACTICE_EVALUATION";
  trustedServerState: {
    question: string;
    questionType: TutorPracticeQuestionType;
    difficulty: TutorPracticeDifficulty;
    expectedAnswer: string;
    learnerAnswer: string;
    serverDeterminedCorrect: boolean;
    suggestedNextDifficulty: TutorPracticeDifficulty;
  };
  personalizationHints: {
    weakSkills: string[];
    continueLearning: string | null;
  };
};

type StoredMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  responseJson: unknown;
};

function normalizePracticeResponse(
  payload: unknown,
): Extract<TutorResponseInput, { type: "PRACTICE" }> | null {
  const modern = validateTutorResponsePayload(payload);
  if (modern?.type === "PRACTICE") {
    return modern;
  }

  const legacy = legacyPracticeResponseSchema.safeParse(payload);
  if (!legacy.success) {
    return null;
  }

  return {
    type: "PRACTICE",
    answer: legacy.data.answer,
    practice: {
      phase: "QUESTION",
      difficulty: "MEDIUM",
      question: legacy.data.practice.question,
      questionType: legacy.data.practice.questionType,
      choices: legacy.data.practice.choices,
      hint: legacy.data.practice.hint,
      explanation: legacy.data.practice.explanation,
      expectedAnswer: legacy.data.practice.expectedAnswer,
    },
  };
}

export function detectGuidedPracticeState(
  messages: StoredMessage[],
  pendingUserMessageId: string,
): GuidedPracticeState {
  const pendingIndex = messages.findIndex((message) => message.id === pendingUserMessageId);
  if (pendingIndex === -1) {
    return { kind: "no_active_practice" };
  }

  const beforePending = messages.slice(0, pendingIndex);
  const lastAssistant = [...beforePending].reverse().find((message) => message.role === "ASSISTANT");
  if (!lastAssistant) {
    return { kind: "no_active_practice" };
  }

  const practice = normalizePracticeResponse(lastAssistant.responseJson);
  if (!practice) {
    return { kind: "no_active_practice" };
  }

  const phase = practice.practice.phase;

  if (phase === "COMPLETION") {
    return { kind: "stale_answer_attempt", reason: "session_completed" };
  }

  if (phase === "EVALUATION") {
    return { kind: "stale_answer_attempt", reason: "no_active_question" };
  }

  if (phase === "QUESTION") {
    const expectedAnswer = practice.practice.expectedAnswer?.trim();
    if (!expectedAnswer) {
      return { kind: "stale_answer_attempt", reason: "malformed_question" };
    }

    return {
      kind: "awaiting_answer",
      active: {
        messageId: lastAssistant.id,
        question: practice.practice.question,
        questionType: practice.practice.questionType,
        difficulty: practice.practice.difficulty,
        choices: practice.practice.choices,
        expectedAnswer,
      },
    };
  }

  return { kind: "no_active_practice" };
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function resolveMultipleChoiceAnswer(
  learnerAnswer: string,
  choices: string[] | undefined,
): string {
  const trimmed = learnerAnswer.trim();
  const letterMatch = trimmed.match(/^([A-Fa-f])[\).:\s]?/);
  if (letterMatch && choices && choices.length > 0) {
    const index = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
    if (index >= 0 && index < choices.length) {
      return choices[index];
    }
  }

  if (/^[1-6]$/.test(trimmed) && choices) {
    const index = Number.parseInt(trimmed, 10) - 1;
    if (index >= 0 && index < choices.length) {
      return choices[index];
    }
  }

  if (choices && choices.length > 0) {
    const exactChoice = choices.find(
      (choice) => normalizeText(choice) === normalizeText(trimmed),
    );
    if (exactChoice) {
      return exactChoice;
    }
  }

  return trimmed;
}

export function evaluatePracticeAnswer(
  active: ActivePracticeQuestion,
  learnerAnswer: string,
): PracticeEvaluation {
  const normalizedExpected = normalizeText(active.expectedAnswer);
  let resolvedLearner = learnerAnswer.trim();

  if (active.questionType === "MULTIPLE_CHOICE") {
    resolvedLearner = resolveMultipleChoiceAnswer(
      learnerAnswer,
      active.choices,
    );
  }

  const normalizedLearner = normalizeText(resolvedLearner);

  let isCorrect = normalizedLearner === normalizedExpected;

  if (!isCorrect && active.questionType === "MULTIPLE_CHOICE") {
    const expectedLetter = active.expectedAnswer.trim().toUpperCase();
    const learnerLetter = learnerAnswer.trim().toUpperCase();
    if (/^[A-F]$/.test(expectedLetter) && learnerLetter === expectedLetter) {
      isCorrect = true;
    }
  }

  if (
    !isCorrect &&
    (active.questionType === "FILL_BLANK" || active.questionType === "TRANSLATION")
  ) {
    isCorrect =
      normalizedLearner.includes(normalizedExpected) ||
      normalizedExpected.includes(normalizedLearner);
  }

  return {
    isCorrect,
    normalizedLearnerAnswer: normalizedLearner,
    normalizedExpectedAnswer: normalizedExpected,
  };
}

export function adaptPracticeDifficulty(
  current: TutorPracticeDifficulty,
  isCorrect: boolean,
): TutorPracticeDifficulty {
  const index = tutorPracticeDifficultyValues.indexOf(current);
  if (isCorrect && index < tutorPracticeDifficultyValues.length - 1) {
    return tutorPracticeDifficultyValues[index + 1];
  }
  if (!isCorrect && index > 0) {
    return tutorPracticeDifficultyValues[index - 1];
  }
  return current;
}

export function buildGuidedPracticeContext(input: {
  active: ActivePracticeQuestion;
  evaluation: PracticeEvaluation;
  learnerContext: TutorLearnerContext;
}): GuidedPracticeContext {
  return {
    mode: "PRACTICE_EVALUATION",
    trustedServerState: {
      question: input.active.question,
      questionType: input.active.questionType,
      difficulty: input.active.difficulty,
      expectedAnswer: input.active.expectedAnswer,
      learnerAnswer: input.evaluation.normalizedLearnerAnswer,
      serverDeterminedCorrect: input.evaluation.isCorrect,
      suggestedNextDifficulty: adaptPracticeDifficulty(
        input.active.difficulty,
        input.evaluation.isCorrect,
      ),
    },
    personalizationHints: {
      weakSkills: input.learnerContext.weaknesses.map((item) => item.skill),
      continueLearning: input.learnerContext.continueLearning?.lessonTitle ?? null,
    },
  };
}

export function buildStalePracticeClarification(reason: string): TutorResponseInput {
  if (reason === "session_completed") {
    return {
      type: "CLARIFICATION",
      answer:
        "This guided practice session is complete. Ask for a new practice topic or a Japanese question to continue.",
    };
  }

  if (reason === "malformed_question") {
    return {
      type: "CLARIFICATION",
      answer:
        "I couldn't recover the active practice question. Please ask for a new practice question.",
    };
  }

  return {
    type: "CLARIFICATION",
    answer:
      "There is no active practice question to answer right now. Ask for tutor practice or ask a Japanese question.",
  };
}

export function enforcePracticeResponseRules(
  response: TutorResponseInput | LegacyTutorResponseInput,
): TutorResponseInput | LegacyTutorResponseInput | null {
  if (response.type !== "PRACTICE") {
    return response;
  }

  if (response.practice.phase === "QUESTION" && !response.practice.expectedAnswer?.trim()) {
    return null;
  }

  if (response.practice.phase === "EVALUATION" && !response.practice.evaluation) {
    return null;
  }

  if (response.practice.phase === "COMPLETION" && !response.practice.sessionSummary?.trim()) {
    return {
      ...response,
      practice: {
        ...response.practice,
        sessionSummary: response.practice.sessionSummary ?? response.answer,
      },
    };
  }

  return response;
}

export function parseStoredPracticeResponse(
  responseJson: unknown,
): Extract<TutorResponseInput, { type: "PRACTICE" }> | null {
  return normalizePracticeResponse(responseJson);
}
