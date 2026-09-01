import "server-only";

import { practiceConfigSchema } from "@/lib/validations/practice";
import type {
  PracticeMode,
  PracticeSafeExercise,
  PracticeSessionPlan,
  PracticeSkill,
  PracticeWeakSkill,
} from "@/types/learning";
import {
  findDueReviewTargetIds,
  findExercisesBySkillAndLevel,
  findLevelPriorityTargetIds,
  findWeaknessTargetIds,
  getExerciseTargetIds,
} from "@/server/learning/practice-session.repository";
import { getJlptPath } from "@/server/learning/jlpt.service";
import { getWeakSkills } from "@/server/learning/analytics.service";
import { prisma } from "@/server/db";

function toSafeExercise(
  exercise: Awaited<ReturnType<typeof findExercisesBySkillAndLevel>>[number],
  skill: PracticeSkill,
): PracticeSafeExercise {
  return {
    id: exercise.id,
    type: exercise.type,
    question: exercise.question,
    difficulty: exercise.difficulty,
    points: exercise.points,
    order: exercise.order,
    options: exercise.options,
    skill,
    jlptLevel: exercise.lesson.jlptLevel.code,
    lessonTitle: exercise.lesson.title,
  };
}

function selectExercisesByTargetPriority(input: {
  exercises: Awaited<ReturnType<typeof findExercisesBySkillAndLevel>>;
  skill: PracticeSkill;
  targetIds: string[];
  limit: number;
  allowFallback: boolean;
}): PracticeSafeExercise[] {
  const { exercises, skill, targetIds, limit, allowFallback } = input;
  const selected = new Map<string, PracticeSafeExercise>();

  for (const targetId of targetIds) {
    const match = exercises.find(
      (exercise) =>
        !selected.has(exercise.id) &&
        getExerciseTargetIds(exercise, skill).includes(targetId),
    );
    if (match) {
      selected.set(match.id, toSafeExercise(match, skill));
    }
    if (selected.size >= limit) break;
  }

  if (allowFallback && selected.size < limit) {
    for (const exercise of exercises) {
      if (!selected.has(exercise.id)) {
        selected.set(exercise.id, toSafeExercise(exercise, skill));
      }
      if (selected.size >= limit) break;
    }
  }

  return Array.from(selected.values()).slice(0, limit);
}

function buildEmptyStateMessage(skill: PracticeSkill, mode: PracticeMode, level: string): string {
  if (mode === "REVIEW") {
    return `You're caught up. There are no ${level} ${skill.toLowerCase()} reviews due right now.`;
  }

  if (mode === "WEAKNESS") {
    return `Not enough ${level} ${skill.toLowerCase()} practice data yet. Try level practice first.`;
  }

  return `${level} ${skill.toLowerCase()} practice is not available yet.`;
}

export async function createPracticeSessionPlan(input: {
  userId: string;
  config: unknown;
}): Promise<PracticeSessionPlan | { error: string }> {
  const parsed = practiceConfigSchema.safeParse(input.config);
  if (!parsed.success) {
    return { error: "Invalid practice configuration." };
  }

  const { level, mode, questionCount, skill } = parsed.data;
  const exercises = await findExercisesBySkillAndLevel(skill, level);

  if (exercises.length === 0) {
    return {
      level,
      skill,
      mode,
      requestedCount: questionCount,
      availableCount: 0,
      exercises: [],
      emptyStateMessage: buildEmptyStateMessage(skill, mode, level),
    };
  }

  let priorityTargetIds: string[] = [];
  if (mode === "REVIEW") {
    priorityTargetIds = await findDueReviewTargetIds(input.userId, skill, level);
  } else if (mode === "WEAKNESS") {
    priorityTargetIds = await findWeaknessTargetIds(input.userId, skill, level);
  } else {
    priorityTargetIds = await findLevelPriorityTargetIds(input.userId, skill, level);
  }

  const selected = selectExercisesByTargetPriority({
    exercises,
    skill,
    targetIds: priorityTargetIds,
    limit: questionCount,
    allowFallback: mode !== "REVIEW",
  });

  return {
    level,
    skill,
    mode,
    requestedCount: questionCount,
    availableCount: selected.length,
    exercises: selected,
    emptyStateMessage:
      selected.length === 0
        ? buildEmptyStateMessage(skill, mode, level)
        : null,
  };
}

export async function getPracticeDefaults(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      japaneseLevel: true,
      targetJlptLevel: true,
    },
  });

  const currentLevel = profile?.japaneseLevel ?? "N5";
  const targetLevel = profile?.targetJlptLevel ?? currentLevel;

  return {
    level: currentLevel,
    skill: "VOCABULARY" as const,
    mode: "LEVEL" as const,
    questionCount: 10 as const,
    path: getJlptPath(currentLevel, targetLevel),
    currentLevel,
    targetLevel,
  };
}

export async function getPracticeAvailabilityMatrix() {
  const lessons = await prisma.lesson.findMany({
    where: { published: true },
    select: {
      jlptLevel: { select: { code: true } },
      exercises: {
        select: {
          vocabularyTargets: { select: { id: true } },
          grammarTargets: { select: { id: true } },
          kanjiTargets: { select: { id: true } },
        },
      },
    },
  });

  const matrix: Record<
    "N5" | "N4" | "N3" | "N2" | "N1",
    { VOCABULARY: number; GRAMMAR: number; KANJI: number }
  > = {
    N5: { VOCABULARY: 0, GRAMMAR: 0, KANJI: 0 },
    N4: { VOCABULARY: 0, GRAMMAR: 0, KANJI: 0 },
    N3: { VOCABULARY: 0, GRAMMAR: 0, KANJI: 0 },
    N2: { VOCABULARY: 0, GRAMMAR: 0, KANJI: 0 },
    N1: { VOCABULARY: 0, GRAMMAR: 0, KANJI: 0 },
  };

  for (const lesson of lessons) {
    for (const exercise of lesson.exercises) {
      if (exercise.vocabularyTargets.length > 0) {
        matrix[lesson.jlptLevel.code].VOCABULARY += 1;
      }
      if (exercise.grammarTargets.length > 0) {
        matrix[lesson.jlptLevel.code].GRAMMAR += 1;
      }
      if (exercise.kanjiTargets.length > 0) {
        matrix[lesson.jlptLevel.code].KANJI += 1;
      }
    }
  }

  return matrix;
}

export async function getWeakSkillRecommendations(userId: string): Promise<PracticeWeakSkill[]> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { japaneseLevel: true },
  });
  const currentLevel = profile?.japaneseLevel ?? "N5";
  const weaknesses = await getWeakSkills(userId, currentLevel, 2);
  return weaknesses.map((item) => ({
    skill: item.skill,
    level: item.level,
    masteryPercent: item.masteryPercent,
  }));
}

