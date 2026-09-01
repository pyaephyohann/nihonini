import "server-only";

import type { JapaneseLevel } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import type {
  JlptCurriculum,
  JlptLevelOverview,
  JlptSkillProgress,
  LessonSummary,
} from "@/types/learning";

const LEVEL_SEQUENCE: JapaneseLevel[] = ["N5", "N4", "N3", "N2", "N1"];

function levelIndex(level: JapaneseLevel): number {
  return LEVEL_SEQUENCE.indexOf(level);
}

function roundPercent(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}

function createLevelValueMap<T>(defaultValue: T): Record<JapaneseLevel, T> {
  return {
    N5: defaultValue,
    N4: defaultValue,
    N3: defaultValue,
    N2: defaultValue,
    N1: defaultValue,
  };
}

export function getJlptPath(
  currentLevel: JapaneseLevel,
  targetLevel: JapaneseLevel,
): JapaneseLevel[] {
  const currentIndex = levelIndex(currentLevel);
  const targetIndex = levelIndex(targetLevel);
  if (currentIndex === -1 || targetIndex === -1) return [currentLevel];

  const step = currentIndex <= targetIndex ? 1 : -1;
  const path: JapaneseLevel[] = [];
  for (let i = currentIndex; step > 0 ? i <= targetIndex : i >= targetIndex; i += step) {
    path.push(LEVEL_SEQUENCE[i]);
  }
  return path;
}

export async function getJlptSkillProgress(
  userId: string,
  level: JapaneseLevel,
): Promise<JlptSkillProgress> {
  const vocabularyCount = await prisma.vocabulary.count({
    where: { jlptLevel: level },
  });
  const grammarCount = await prisma.grammar.count({
    where: { jlptLevel: level },
  });
  const kanjiCount = await prisma.kanji.count({
    where: { jlptLevel: level },
  });
  const vocabularyProgressRows = await prisma.userVocabularyProgress.findMany({
    where: { userId },
    select: { mastery: true, vocabulary: { select: { jlptLevel: true } } },
  });
  const grammarProgressRows = await prisma.userGrammarProgress.findMany({
    where: { userId },
    select: { mastery: true, grammar: { select: { jlptLevel: true } } },
  });
  const kanjiProgressRows = await prisma.userKanjiProgress.findMany({
    where: { userId },
    select: { mastery: true, kanji: { select: { jlptLevel: true } } },
  });

  const vocabularyMasterySum = vocabularyProgressRows.reduce(
    (sum, row) =>
      row.vocabulary.jlptLevel === level ? sum + row.mastery : sum,
    0,
  );
  const grammarMasterySum = grammarProgressRows.reduce(
    (sum, row) => (row.grammar.jlptLevel === level ? sum + row.mastery : sum),
    0,
  );
  const kanjiMasterySum = kanjiProgressRows.reduce(
    (sum, row) => (row.kanji.jlptLevel === level ? sum + row.mastery : sum),
    0,
  );

  const vocabulary = vocabularyCount
    ? roundPercent((vocabularyMasterySum / vocabularyCount) * 100)
    : 0;
  const grammar = grammarCount
    ? roundPercent((grammarMasterySum / grammarCount) * 100)
    : 0;
  const kanji = kanjiCount
    ? roundPercent((kanjiMasterySum / kanjiCount) * 100)
    : 0;

  const available = [
    vocabularyCount > 0 ? vocabulary : null,
    grammarCount > 0 ? grammar : null,
    kanjiCount > 0 ? kanji : null,
  ].filter((value): value is number => value !== null);

  const overall = available.length
    ? roundPercent(available.reduce((sum, value) => sum + value, 0) / available.length)
    : 0;

  return {
    vocabulary,
    grammar,
    kanji,
    reading: null,
    listening: null,
    overall,
  };
}

export async function getUserJlptCurriculum(userId: string): Promise<JlptCurriculum> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { japaneseLevel: true, targetJlptLevel: true },
  });

  if (!profile) {
    return {
      learnerGoal: { currentLevel: "N5", targetLevel: "N5" },
      path: ["N5"],
      levels: [],
    };
  }

  const targetLevel = profile.targetJlptLevel ?? profile.japaneseLevel;
  const path = getJlptPath(profile.japaneseLevel, targetLevel);

  const levels = await prisma.jlptLevel.findMany({
    orderBy: { order: "asc" },
    select: {
      code: true,
      name: true,
      description: true,
      lessons: {
        where: { published: true },
        select: { id: true },
      },
    },
  });

  const completedLessonProgress = await prisma.userLessonProgress.findMany({
    where: { userId, status: "COMPLETED", lesson: { published: true } },
    select: { lesson: { select: { jlptLevel: { select: { code: true } } } } },
  });

  const completedCountByLevel = new Map<JapaneseLevel, number>();
  for (const row of completedLessonProgress) {
    const code = row.lesson.jlptLevel.code;
    completedCountByLevel.set(code, (completedCountByLevel.get(code) ?? 0) + 1);
  }

  const [vocabCounts, grammarCounts, kanjiCounts, vocabProgress, grammarProgress, kanjiProgress] =
    await Promise.all([
      prisma.vocabulary.groupBy({
        by: ["jlptLevel"],
        _count: { _all: true },
      }),
      prisma.grammar.groupBy({
        by: ["jlptLevel"],
        _count: { _all: true },
      }),
      prisma.kanji.groupBy({
        by: ["jlptLevel"],
        _count: { _all: true },
      }),
      prisma.userVocabularyProgress.findMany({
        where: { userId },
        select: { mastery: true, vocabulary: { select: { jlptLevel: true } } },
      }),
      prisma.userGrammarProgress.findMany({
        where: { userId },
        select: { mastery: true, grammar: { select: { jlptLevel: true } } },
      }),
      prisma.userKanjiProgress.findMany({
        where: { userId },
        select: { mastery: true, kanji: { select: { jlptLevel: true } } },
      }),
    ]);

  const vocabularyTotals = createLevelValueMap(0);
  const grammarTotals = createLevelValueMap(0);
  const kanjiTotals = createLevelValueMap(0);
  const vocabularyMasterySums = createLevelValueMap(0);
  const grammarMasterySums = createLevelValueMap(0);
  const kanjiMasterySums = createLevelValueMap(0);

  for (const row of vocabCounts) {
    vocabularyTotals[row.jlptLevel] = row._count._all;
  }
  for (const row of grammarCounts) {
    grammarTotals[row.jlptLevel] = row._count._all;
  }
  for (const row of kanjiCounts) {
    kanjiTotals[row.jlptLevel] = row._count._all;
  }
  for (const row of vocabProgress) {
    vocabularyMasterySums[row.vocabulary.jlptLevel] += row.mastery;
  }
  for (const row of grammarProgress) {
    grammarMasterySums[row.grammar.jlptLevel] += row.mastery;
  }
  for (const row of kanjiProgress) {
    kanjiMasterySums[row.kanji.jlptLevel] += row.mastery;
  }

  const levelProgress = levels.map((level) => {
    const code = level.code;
    const vocabulary = vocabularyTotals[code]
      ? (vocabularyMasterySums[code] / vocabularyTotals[code]) * 100
      : null;
    const grammar = grammarTotals[code]
      ? (grammarMasterySums[code] / grammarTotals[code]) * 100
      : null;
    const kanji = kanjiTotals[code]
      ? (kanjiMasterySums[code] / kanjiTotals[code]) * 100
      : null;

    const available = [vocabulary, grammar, kanji].filter(
      (value): value is number => value !== null,
    );
    const overall = available.length
      ? roundPercent(available.reduce((sum, value) => sum + value, 0) / available.length)
      : 0;

    const completedLessons = completedCountByLevel.get(level.code) ?? 0;
    const overview: JlptLevelOverview = {
      level: level.code,
      name: level.name,
      description: level.description,
      lessonCount: level.lessons.length,
      completedLessons,
      progressPercent: overall,
      isTarget: level.code === targetLevel,
      isCurrent: level.code === profile.japaneseLevel,
    };
    return overview;
  });

  return {
    learnerGoal: {
      currentLevel: profile.japaneseLevel,
      targetLevel,
    },
    path,
    levels: levelProgress,
  };
}

export async function getNextRecommendedLesson(userId: string): Promise<LessonSummary | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { japaneseLevel: true, targetJlptLevel: true },
  });
  if (!profile) return null;

  const inProgress = await prisma.userLessonProgress.findFirst({
    where: {
      userId,
      status: "IN_PROGRESS",
      lesson: { published: true },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      progress: true,
      status: true,
      lesson: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          order: true,
          estimatedMinutes: true,
          category: true,
          jlptLevel: { select: { code: true } },
        },
      },
    },
  });

  if (inProgress) {
    return {
      ...inProgress.lesson,
      jlptLevel: inProgress.lesson.jlptLevel.code,
      progressPercent: Math.round(inProgress.progress),
      lessonStatus: inProgress.status,
      recommended: true,
    };
  }

  const target = profile.targetJlptLevel ?? profile.japaneseLevel;
  const path = getJlptPath(profile.japaneseLevel, target);
  const prioritizedLevels = [
    ...path,
    ...LEVEL_SEQUENCE.filter((level) => !path.includes(level)),
  ];

  const lessons = await prisma.lesson.findMany({
    where: { published: true },
    orderBy: [{ jlptLevel: { order: "asc" } }, { order: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      order: true,
      estimatedMinutes: true,
      category: true,
      jlptLevel: { select: { code: true } },
      progresses: {
        where: { userId },
        select: { progress: true, status: true },
        take: 1,
      },
    },
  });

  const sortableLessons = lessons
    .map((lesson) => {
      const progress = lesson.progresses[0];
      return {
        ...lesson,
        level: lesson.jlptLevel.code,
        progressPercent: progress ? Math.round(progress.progress) : 0,
        lessonStatus: progress?.status,
      };
    })
    .sort((a, b) => {
      const levelRank = prioritizedLevels.indexOf(a.level) - prioritizedLevels.indexOf(b.level);
      if (levelRank !== 0) return levelRank;
      return a.order - b.order;
    });

  const next = sortableLessons.find((lesson) => lesson.lessonStatus !== "COMPLETED");
  const picked = next ?? sortableLessons[0];
  if (!picked) return null;

  return {
    id: picked.id,
    title: picked.title,
    slug: picked.slug,
    description: picked.description,
    category: picked.category,
    order: picked.order,
    estimatedMinutes: picked.estimatedMinutes,
    jlptLevel: picked.level,
    progressPercent: picked.progressPercent,
    lessonStatus: picked.lessonStatus,
    recommended: true,
  };
}

