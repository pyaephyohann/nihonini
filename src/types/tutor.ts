import type { JapaneseLevel, LearningGoal } from "@/generated/prisma/client";
import type {
  LegacyTutorResponseInput,
  TutorMistakeCategory,
  TutorPracticeDifficulty,
  TutorPracticePhase,
  TutorPracticeQuestionType,
  TutorResponseInput,
  TutorResponseType,
  TutorSuggestedActionType,
} from "@/lib/validations/tutor";

export type TutorSkillSnapshot = {
  masteryPercent: number | null;
  itemsStarted?: number;
};

export type TutorLearnerContext = {
  profile: {
    japaneseLevel: JapaneseLevel;
    targetJlptLevel: JapaneseLevel;
    learningGoal: LearningGoal;
  };
  skills: {
    vocabulary: TutorSkillSnapshot;
    grammar: TutorSkillSnapshot;
    kanji: TutorSkillSnapshot;
    reading: TutorSkillSnapshot | null;
    listening: TutorSkillSnapshot | null;
  };
  weaknesses: Array<{ skill: string; masteryPercent: number }>;
  strengths: Array<{ skill: string; masteryPercent: number }>;
  practice: {
    recentAccuracy: number | null;
    sampleSize: number;
  };
  assessment: {
    latestScore: number | null;
    bestScore: number | null;
  } | null;
  continueLearning: {
    lessonTitle: string;
    progressPercent: number;
  } | null;
};

export type TutorGroundedContent = {
  kind: "VOCABULARY" | "GRAMMAR" | "KANJI" | "LESSON";
  id: string;
  title: string;
  jlptLevel: JapaneseLevel;
  content: string;
};

export type TutorExample = {
  japanese: string;
  reading?: string;
  meaning: string;
};

export type TutorSuggestedAction = {
  type: TutorSuggestedActionType;
  label: string;
};

export type TutorRelatedContent = {
  kind: "VOCABULARY" | "GRAMMAR" | "KANJI" | "LESSON";
  id: string;
  title: string;
};

export type TutorLegacyCorrection = {
  original: string;
  corrected: string;
  note: string;
};

export type TutorMistake = {
  category: TutorMistakeCategory;
  original: string;
  correction: string;
  explanation: string;
};

export type TutorCorrectionDetail = {
  original: string;
  corrected: string;
  mistakes: TutorMistake[];
  overallExplanation: string;
};

export type TutorComparisonDetail = {
  itemA: string;
  itemB: string;
  differences: Array<{
    aspect: string;
    itemA: string;
    itemB: string;
  }>;
};

export type TutorPracticePayload = {
  phase: TutorPracticePhase;
  difficulty: TutorPracticeDifficulty;
  question: string;
  questionType: TutorPracticeQuestionType;
  choices?: string[];
  hint?: string;
  explanation?: string;
  evaluation?: {
    isCorrect: boolean;
    feedback?: string;
  };
  sessionSummary?: string;
};

/** Client-safe tutor response — practice payloads omit expectedAnswer. */
export type TutorResponse =
  | Exclude<TutorResponseInput, { type: "PRACTICE" }>
  | (Extract<TutorResponseInput, { type: "PRACTICE" }> & {
      practice: TutorPracticePayload;
    })
  | LegacyTutorResponseInput;

export type { TutorResponseType, TutorSuggestedActionType };

export type TutorConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
};

export type TutorMessageDto = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
  response?: TutorResponse;
};

export type TutorConversationDetail = TutorConversationSummary & {
  messages: TutorMessageDto[];
};

export type SendTutorMessageSuccess = TutorResponse & {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  userMessage: TutorMessageDto;
  assistantMessage: TutorMessageDto;
};

export type SendTutorMessageResult =
  | SendTutorMessageSuccess
  | {
      error: string;
      conversationId?: string;
      userMessageId?: string;
    };
