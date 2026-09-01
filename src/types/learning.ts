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
    reading: number | null;
    listening: number | null;
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
  reading: number | null;
  listening: number | null;
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
export type LearningSkill = PracticeSkill | "READING" | "LISTENING";
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

export type SkillInsight = {
  skill: PracticeSkill;
  level: JapaneseLevel;
  masteryPercent: number;
  itemsStarted: number;
};

export type SkillAnalytics = {
  skill: LearningSkill;
  masteryPercent: number;
  accuracy: number | null;
  totalItems: number;
  itemsStarted: number;
  itemsMastered: number;
  itemsInProgress: number;
  dueReviews: number;
  hasData: boolean;
};

export type LearningAnalytics = {
  hasActivity: boolean;
  overall: {
    masteryPercent: number;
    accuracy: number | null;
    completedLessons: number;
    totalLessons: number;
  };
  skills: {
    vocabulary: SkillAnalytics;
    grammar: SkillAnalytics;
    kanji: SkillAnalytics;
    reading: SkillAnalytics | null;
    listening: SkillAnalytics | null;
  };
  practice: {
    totalAttempts: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number | null;
    recentAccuracy: number | null;
    recentSampleSize: number;
  };
  jlpt: {
    currentLevel: JapaneseLevel;
    targetLevel: JapaneseLevel;
    path: JapaneseLevel[];
    targetPathProgress: number;
    currentLevelProgress: number;
    levels: {
      level: JapaneseLevel;
      name: string;
      progressPercent: number;
      lessonCount: number;
      completedLessons: number;
      isCurrent: boolean;
      isTarget: boolean;
      hasContent: boolean;
    }[];
  };
  weaknesses: SkillInsight[];
  strengths: SkillInsight[];
  accuracyTrend: {
    day: string;
    label: string;
    accuracy: number;
    total: number;
  }[];
  recentPracticeDays: {
    day: string;
    label: string;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
  }[];
  recentActivity: {
    type: "LESSON_COMPLETED" | "PRACTICE" | "READING" | "LISTENING";
    label: string;
    href: string;
    occurredAt: string;
  }[];
  recentReading: RecentReadingActivity[];
  recentListening: RecentListeningActivity[];
};

export type ReadingQuestionOptionDTO = {
  id: string;
  text: string;
  order: number;
};

export type ReadingQuestionDTO = {
  id: string;
  question: string;
  order: number;
  options: ReadingQuestionOptionDTO[];
};

export type ReadingSummary = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  jlptLevel: JapaneseLevel;
  difficulty: number;
  difficultyLabel: string;
  estimatedMinutes: number;
  order: number;
  attemptCount: number;
  completed: boolean;
  bestScore: number;
  lastScore: number;
  masteryPercent: number;
};

export type ReadingDetail = ReadingSummary & {
  passage: string;
  questions: ReadingQuestionDTO[];
};

export type ReadingCatalogLevel = {
  level: JapaneseLevel;
  readings: ReadingListItem[];
};

export type ReadingListItem = ReadingSummary;

export type ReadingGradedAnswer = {
  questionId: string;
  question: string;
  selectedOptionId: string;
  selectedOptionText: string;
  correctOptionId: string;
  correctOptionText: string;
  isCorrect: boolean;
  explanation: string | null;
};

export type ReadingSubmissionResult = {
  submissionId: string;
  readingId: string;
  readingTitle: string;
  readingSlug: string;
  jlptLevel: JapaneseLevel;
  correctCount: number;
  totalCount: number;
  incorrectCount: number;
  scorePercent: number;
  accuracy: number;
  masteryPercent: number;
  completed: boolean;
  answers: ReadingGradedAnswer[];
};

export type RecentReadingActivity = {
  title: string;
  slug: string;
  jlptLevel: JapaneseLevel;
  correctCount: number;
  totalCount: number;
  scorePercent: number;
  occurredAt: string;
};

export type ListeningQuestionOptionDTO = {
  id: string;
  text: string;
  order: number;
};

export type ListeningQuestionDTO = {
  id: string;
  question: string;
  order: number;
  options: ListeningQuestionOptionDTO[];
};

export type ListeningSummary = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  jlptLevel: JapaneseLevel;
  difficulty: number;
  difficultyLabel: string;
  estimatedMinutes: number;
  durationSeconds: number | null;
  order: number;
  attemptCount: number;
  completed: boolean;
  bestScore: number;
  lastScore: number;
  masteryPercent: number;
};

export type ListeningDetail = ListeningSummary & {
  audioUrl: string;
  questions: ListeningQuestionDTO[];
};

export type ListeningCatalogLevel = {
  level: JapaneseLevel;
  listenings: ListeningListItem[];
};

export type ListeningListItem = ListeningSummary;

export type ListeningGradedAnswer = {
  questionId: string;
  question: string;
  selectedOptionId: string;
  selectedOptionText: string;
  correctOptionId: string;
  correctOptionText: string;
  isCorrect: boolean;
  explanation: string | null;
};

export type ListeningSubmissionResult = {
  submissionId: string;
  listeningId: string;
  listeningTitle: string;
  listeningSlug: string;
  jlptLevel: JapaneseLevel;
  correctCount: number;
  totalCount: number;
  incorrectCount: number;
  scorePercent: number;
  accuracy: number;
  masteryPercent: number;
  completed: boolean;
  transcript: string | null;
  answers: ListeningGradedAnswer[];
};

export type RecentListeningActivity = {
  title: string;
  slug: string;
  jlptLevel: JapaneseLevel;
  correctCount: number;
  totalCount: number;
  scorePercent: number;
  occurredAt: string;
};
