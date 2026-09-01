import "server-only";

import type { ExerciseType, JapaneseLevel } from "@/generated/prisma/client";
import { MASTERED_MASTERY_THRESHOLD } from "@/server/learning/mastery";
import { prisma } from "@/server/db";
import type { PracticeMode, PracticeSkill } from "@/types/learning";

type ExerciseSelect = {
  id: string;
  type: ExerciseType;
  question: string;
  difficulty: number;
  points: number;
  order: number;
  options: { id: string; text: string; order: number }[];
  lesson: {
    title: string;
    jlptLevel: { code: JapaneseLevel };
    order: number;
  };
  vocabularyTargets: { vocabularyId: string }[];
  grammarTargets: { grammarId: string }[];
  kanjiTargets: { kanjiId: string }[];
};

function exerciseWhereForSkill(level: JapaneseLevel, skill: PracticeSkill) {
  if (skill === "VOCABULARY") {
    return {
      lesson: { published: true },
      vocabularyTargets: {
        some: {
          vocabulary: { jlptLevel: level },
        },
      },
    };
  }

  if (skill === "GRAMMAR") {
    return {
      lesson: { published: true },
      grammarTargets: {
        some: {
          grammar: { jlptLevel: level },
        },
      },
    };
  }

  return {
    lesson: { published: true },
    kanjiTargets: {
      some: {
        kanji: { jlptLevel: level },
      },
    },
  };
}

export async function findExercisesBySkillAndLevel(
  skill: PracticeSkill,
  level: JapaneseLevel,
): Promise<ExerciseSelect[]> {
  return prisma.exercise.findMany({
    where: exerciseWhereForSkill(level, skill),
    orderBy: [{ lesson: { order: "asc" } }, { order: "asc" }, { id: "asc" }],
    select: {
      id: true,
      type: true,
      question: true,
      difficulty: true,
      points: true,
      order: true,
      options: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          text: true,
          order: true,
        },
      },
      lesson: {
        select: {
          title: true,
          order: true,
          jlptLevel: { select: { code: true } },
        },
      },
      vocabularyTargets: { select: { vocabularyId: true } },
      grammarTargets: { select: { grammarId: true } },
      kanjiTargets: { select: { kanjiId: true } },
    },
  });
}

export async function findDueReviewTargetIds(
  userId: string,
  skill: PracticeSkill,
  level: JapaneseLevel,
): Promise<string[]> {
  const now = new Date();

  if (skill === "VOCABULARY") {
    const rows = await prisma.userVocabularyProgress.findMany({
      where: {
        userId,
        nextReviewAt: { lte: now },
        vocabulary: { jlptLevel: level },
      },
      orderBy: [{ nextReviewAt: "asc" }, { mastery: "asc" }, { vocabularyId: "asc" }],
      select: { vocabularyId: true },
    });
    return rows.map((row) => row.vocabularyId);
  }

  if (skill === "GRAMMAR") {
    const rows = await prisma.userGrammarProgress.findMany({
      where: {
        userId,
        nextReviewAt: { lte: now },
        grammar: { jlptLevel: level },
      },
      orderBy: [{ nextReviewAt: "asc" }, { mastery: "asc" }, { grammarId: "asc" }],
      select: { grammarId: true },
    });
    return rows.map((row) => row.grammarId);
  }

  const rows = await prisma.userKanjiProgress.findMany({
    where: {
      userId,
      nextReviewAt: { lte: now },
      kanji: { jlptLevel: level },
    },
    orderBy: [{ nextReviewAt: "asc" }, { mastery: "asc" }, { kanjiId: "asc" }],
    select: { kanjiId: true },
  });
  return rows.map((row) => row.kanjiId);
}

export async function findWeaknessTargetIds(
  userId: string,
  skill: PracticeSkill,
  level: JapaneseLevel,
): Promise<string[]> {
  if (skill === "VOCABULARY") {
    const [content, progress] = await Promise.all([
      prisma.vocabulary.findMany({
        where: { jlptLevel: level },
        select: { id: true },
        orderBy: { id: "asc" },
      }),
      prisma.userVocabularyProgress.findMany({
        where: { userId, vocabulary: { jlptLevel: level } },
        select: { vocabularyId: true, mastery: true, attemptCount: true },
        orderBy: [{ mastery: "asc" }, { attemptCount: "asc" }, { vocabularyId: "asc" }],
      }),
    ]);

    const seen = new Set(progress.map((row) => row.vocabularyId));
    const unseen = content.map((item) => item.id).filter((id) => !seen.has(id));
    return [...progress.map((row) => row.vocabularyId), ...unseen];
  }

  if (skill === "GRAMMAR") {
    const [content, progress] = await Promise.all([
      prisma.grammar.findMany({
        where: { jlptLevel: level },
        select: { id: true },
        orderBy: { id: "asc" },
      }),
      prisma.userGrammarProgress.findMany({
        where: { userId, grammar: { jlptLevel: level } },
        select: { grammarId: true, mastery: true, attemptCount: true },
        orderBy: [{ mastery: "asc" }, { attemptCount: "asc" }, { grammarId: "asc" }],
      }),
    ]);

    const seen = new Set(progress.map((row) => row.grammarId));
    const unseen = content.map((item) => item.id).filter((id) => !seen.has(id));
    return [...progress.map((row) => row.grammarId), ...unseen];
  }

  const [content, progress] = await Promise.all([
    prisma.kanji.findMany({
      where: { jlptLevel: level },
      select: { id: true },
      orderBy: { id: "asc" },
    }),
    prisma.userKanjiProgress.findMany({
      where: { userId, kanji: { jlptLevel: level } },
      select: { kanjiId: true, mastery: true, attemptCount: true },
      orderBy: [{ mastery: "asc" }, { attemptCount: "asc" }, { kanjiId: "asc" }],
    }),
  ]);

  const seen = new Set(progress.map((row) => row.kanjiId));
  const unseen = content.map((item) => item.id).filter((id) => !seen.has(id));
  return [...progress.map((row) => row.kanjiId), ...unseen];
}

export async function findLevelPriorityTargetIds(
  userId: string,
  skill: PracticeSkill,
  level: JapaneseLevel,
): Promise<string[]> {
  if (skill === "VOCABULARY") {
    const [content, progress] = await Promise.all([
      prisma.vocabulary.findMany({
        where: { jlptLevel: level },
        select: { id: true },
        orderBy: { id: "asc" },
      }),
      prisma.userVocabularyProgress.findMany({
        where: { userId, vocabulary: { jlptLevel: level } },
        select: { vocabularyId: true, mastery: true, attemptCount: true },
        orderBy: [{ mastery: "asc" }, { attemptCount: "asc" }, { vocabularyId: "asc" }],
      }),
    ]);

    const nonMastered = progress
      .filter((row) => row.mastery < MASTERED_MASTERY_THRESHOLD)
      .map((row) => row.vocabularyId);
    const mastered = progress
      .filter((row) => row.mastery >= MASTERED_MASTERY_THRESHOLD)
      .map((row) => row.vocabularyId);
    const seen = new Set(progress.map((row) => row.vocabularyId));
    const unseen = content.map((item) => item.id).filter((id) => !seen.has(id));
    return [...nonMastered, ...unseen, ...mastered];
  }

  if (skill === "GRAMMAR") {
    const [content, progress] = await Promise.all([
      prisma.grammar.findMany({
        where: { jlptLevel: level },
        select: { id: true },
        orderBy: { id: "asc" },
      }),
      prisma.userGrammarProgress.findMany({
        where: { userId, grammar: { jlptLevel: level } },
        select: { grammarId: true, mastery: true, attemptCount: true },
        orderBy: [{ mastery: "asc" }, { attemptCount: "asc" }, { grammarId: "asc" }],
      }),
    ]);

    const nonMastered = progress
      .filter((row) => row.mastery < MASTERED_MASTERY_THRESHOLD)
      .map((row) => row.grammarId);
    const mastered = progress
      .filter((row) => row.mastery >= MASTERED_MASTERY_THRESHOLD)
      .map((row) => row.grammarId);
    const seen = new Set(progress.map((row) => row.grammarId));
    const unseen = content.map((item) => item.id).filter((id) => !seen.has(id));
    return [...nonMastered, ...unseen, ...mastered];
  }

  const [content, progress] = await Promise.all([
    prisma.kanji.findMany({
      where: { jlptLevel: level },
      select: { id: true },
      orderBy: { id: "asc" },
    }),
    prisma.userKanjiProgress.findMany({
      where: { userId, kanji: { jlptLevel: level } },
      select: { kanjiId: true, mastery: true, attemptCount: true },
      orderBy: [{ mastery: "asc" }, { attemptCount: "asc" }, { kanjiId: "asc" }],
    }),
  ]);

  const nonMastered = progress
    .filter((row) => row.mastery < MASTERED_MASTERY_THRESHOLD)
    .map((row) => row.kanjiId);
  const mastered = progress
    .filter((row) => row.mastery >= MASTERED_MASTERY_THRESHOLD)
    .map((row) => row.kanjiId);
  const seen = new Set(progress.map((row) => row.kanjiId));
  const unseen = content.map((item) => item.id).filter((id) => !seen.has(id));
  return [...nonMastered, ...unseen, ...mastered];
}

export function getExerciseTargetIds(
  exercise: ExerciseSelect,
  skill: PracticeSkill,
): string[] {
  if (skill === "VOCABULARY") {
    return exercise.vocabularyTargets.map((target) => target.vocabularyId);
  }

  if (skill === "GRAMMAR") {
    return exercise.grammarTargets.map((target) => target.grammarId);
  }

  return exercise.kanjiTargets.map((target) => target.kanjiId);
}

export function getPracticeModeLabel(mode: PracticeMode): string {
  if (mode === "REVIEW") return "Review";
  if (mode === "WEAKNESS") return "Weakness";
  return "Level";
}

