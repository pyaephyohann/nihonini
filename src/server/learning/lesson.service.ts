import "server-only";

import type { LessonDetail } from "@/types/learning";
import {
  findPublishedLessonBySlug,
  findPublishedLessonsByLevel,
  findPublishedLessonsByLevelForUser,
} from "@/server/learning/lesson.repository";

export async function getPublishedLessonsCatalog() {
  return findPublishedLessonsByLevel();
}

export async function getUserLessonsCatalog(userId: string) {
  const levels = await findPublishedLessonsByLevelForUser(userId);

  return levels.map((level) => {
    let previousCompleted = true;
    const lessons = level.lessons.map((lesson, index) => {
      const locked = index === 0 ? false : !previousCompleted;
      const completed = lesson.lessonStatus === "COMPLETED";
      previousCompleted = completed;

      return {
        ...lesson,
        locked,
      };
    });

    return {
      ...level,
      lessons,
    };
  });
}

export async function getLessonBySlug(slug: string): Promise<LessonDetail | null> {
  const lesson = await findPublishedLessonBySlug(slug);

  if (!lesson) {
    return null;
  }

  return {
    id: lesson.id,
    title: lesson.title,
    slug: lesson.slug,
    description: lesson.description,
    order: lesson.order,
    estimatedMinutes: lesson.estimatedMinutes,
    jlptLevel: lesson.jlptLevel.code,
    vocabularies: lesson.vocabularies.map((item) => ({
      order: item.order,
      id: item.vocabulary.id,
      word: item.vocabulary.word,
      reading: item.vocabulary.reading,
      meaning: item.vocabulary.meaning,
      partOfSpeech: item.vocabulary.partOfSpeech,
      exampleSentence: item.vocabulary.exampleSentence,
      exampleReading: item.vocabulary.exampleReading,
      kanji: item.vocabulary.kanji.map((link) => ({
        character: link.kanji.character,
        meaning: link.kanji.meaning,
      })),
    })),
    grammars: lesson.grammars.map((item) => ({
      order: item.order,
      id: item.grammar.id,
      pattern: item.grammar.pattern,
      meaning: item.grammar.meaning,
      explanation: item.grammar.explanation,
      structure: item.grammar.structure,
      exampleSentence: item.grammar.exampleSentence,
      exampleReading: item.grammar.exampleReading,
    })),
    kanji: lesson.kanjiItems.map((item) => ({
      order: item.order,
      id: item.kanji.id,
      character: item.kanji.character,
      meaning: item.kanji.meaning,
      onyomi: item.kanji.onyomi,
      kunyomi: item.kanji.kunyomi,
      strokeCount: item.kanji.strokeCount,
    })),
    exercises: lesson.exercises.map((exercise) => ({
      id: exercise.id,
      type: exercise.type,
      question: exercise.question,
      difficulty: exercise.difficulty,
      points: exercise.points,
      order: exercise.order,
      options: exercise.options,
    })),
  };
}
