import type {
  ExerciseType,
  JapaneseLevel,
  LessonCategory,
  LessonProgressStatus,
  LearningGoal,
  PartOfSpeech,
} from "@/generated/prisma/client";

export type ClientExerciseOption = {
  id: string;
  text: string;
  order: number;
};

export type ClientExercise = {
  id: string;
  type: ExerciseType;
  question: string;
  difficulty: number;
  points: number;
  order: number;
  options: ClientExerciseOption[];
};

export type LessonVocabularyItem = {
  order: number;
  id: string;
  word: string;
  reading: string;
  meaning: string;
  partOfSpeech: PartOfSpeech;
  exampleSentence: string | null;
  exampleReading: string | null;
  kanji: { character: string; meaning: string }[];
};

export type LessonGrammarItem = {
  order: number;
  id: string;
  pattern: string;
  meaning: string;
  explanation: string;
  structure: string;
  exampleSentence: string | null;
  exampleReading: string | null;
};

export type LessonKanjiItem = {
  order: number;
  id: string;
  character: string;
  meaning: string;
  onyomi: string;
  kunyomi: string;
  strokeCount: number;
};

export type LessonSummary = {
  id: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  estimatedMinutes: number;
  jlptLevel: JapaneseLevel;
  category: LessonCategory;
  progressPercent?: number;
  lessonStatus?: LessonProgressStatus;
  recommended?: boolean;
};

export type LessonDetail = LessonSummary & {
  vocabularies: LessonVocabularyItem[];
  grammars: LessonGrammarItem[];
  kanji: LessonKanjiItem[];
  exercises: ClientExercise[];
};

export type JlptLevelWithLessons = {
  id: string;
  code: JapaneseLevel;
  name: string;
  description: string;
  order: number;
  lessons: LessonSummary[];
};

export type ExerciseCheckResult = {
  correct: boolean;
  correctAnswer: string;
  explanation: string | null;
  points: number;
  lessonProgress: number;
  lessonStatus: LessonProgressStatus;
  itemMastery: {
    vocabulary: number | null;
    grammar: number | null;
    kanji: number | null;
  };
  nextReviewAt: string | null;
};

export type DueReviewSummary = {
  vocabulary: number;
  grammar: number;
  kanji: number;
  total: number;
};

export type DailyProgress = {
  completed: number;
  target: number;
  percentage: number;
};

export type DashboardSnapshot = {
  streakDays: number;
  dueReviews: DueReviewSummary;
  dailyProgress: DailyProgress;
  learnerGoal: {
    currentLevel: JapaneseLevel;
    targetLevel: JapaneseLevel;
    learningGoal: LearningGoal;
    dailyGoal: number;
  };
  jlptPath: JapaneseLevel[];
  jlptPreparationProgress: number;
  jlptSkillProgress: {
    vocabulary: number;
    grammar: number;
    kanji: number;
    reading: null;
    listening: null;
  };
  continueLearning: {
    lessonTitle: string | null;
    lessonSlug: string | null;
    progressPercent: number;
  };
};

export type JlptSkillProgress = {
  vocabulary: number;
  grammar: number;
  kanji: number;
  reading: null;
  listening: null;
  overall: number;
};

export type JlptLevelOverview = {
  level: JapaneseLevel;
  name: string;
  description: string;
  lessonCount: number;
  completedLessons: number;
  progressPercent: number;
  isTarget: boolean;
  isCurrent: boolean;
};

export type JlptCurriculum = {
  learnerGoal: {
    currentLevel: JapaneseLevel;
    targetLevel: JapaneseLevel;
  };
  path: JapaneseLevel[];
  levels: JlptLevelOverview[];
};

export type PracticeSkill = "VOCABULARY" | "GRAMMAR" | "KANJI";
export type PracticeMode = "REVIEW" | "WEAKNESS" | "LEVEL";

export type PracticeSafeExercise = ClientExercise & {
  skill: PracticeSkill;
  jlptLevel: JapaneseLevel;
  lessonTitle: string;
};

export type PracticeSessionPlan = {
  level: JapaneseLevel;
  skill: PracticeSkill;
  mode: PracticeMode;
  requestedCount: number;
  availableCount: number;
  exercises: PracticeSafeExercise[];
  emptyStateMessage: string | null;
};

export type PracticeWeakSkill = {
  skill: PracticeSkill;
  level: JapaneseLevel;
  masteryPercent: number;
};
