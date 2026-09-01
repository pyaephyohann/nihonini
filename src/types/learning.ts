import type {
  ExerciseType,
  JapaneseLevel,
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
};
