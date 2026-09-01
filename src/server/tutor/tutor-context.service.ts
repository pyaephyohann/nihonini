import "server-only";

import type { JapaneseLevel } from "@/generated/prisma/client";
import { getWeakSkills, getStrongSkills } from "@/server/learning/analytics.service";
import { getNextRecommendedLesson } from "@/server/learning/jlpt.service";
import { getJlptSkillProgress } from "@/server/learning/jlpt.service";
import { getMockExamAssessmentMetrics } from "@/server/learning/mock-exam.service";
import { getReadingSkillMetrics } from "@/server/learning/reading.service";
import { getListeningSkillMetrics } from "@/server/learning/listening.service";
import { prisma } from "@/server/db";
import type { TutorLearnerContext } from "@/types/tutor";

const RECENT_PRACTICE_SAMPLE = 20;

function roundPercent(value: number | null): number | null {
  if (value === null) return null;
  return Math.round(Math.min(100, Math.max(0, value)));
}

export async function buildTutorLearnerContext(
  userId: string,
): Promise<TutorLearnerContext | { error: string }> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      japaneseLevel: true,
      targetJlptLevel: true,
      learningGoal: true,
    },
  });

  if (!profile) {
    return { error: "Complete your profile before using the tutor." };
  }

  const currentLevel = profile.japaneseLevel;
  const targetLevel = profile.targetJlptLevel ?? currentLevel;

  const skillProgress = await getJlptSkillProgress(userId, currentLevel);
  const weaknesses = await getWeakSkills(userId, currentLevel, 2);
  const strengths = await getStrongSkills(userId, currentLevel, 1);

  const recentAttempts = await prisma.practiceAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: RECENT_PRACTICE_SAMPLE,
    select: { isCorrect: true },
  });

  const recentCorrect = recentAttempts.filter((row) => row.isCorrect).length;
  const recentAccuracy =
    recentAttempts.length > 0
      ? roundPercent(Math.round((recentCorrect / recentAttempts.length) * 100))
      : null;

  const readingMetrics = await getReadingSkillMetrics(userId, currentLevel);
  const listeningMetrics = await getListeningSkillMetrics(userId, currentLevel);
  const assessment = await getMockExamAssessmentMetrics(userId);
  const recommendation = await getNextRecommendedLesson(userId);

  return {
    profile: {
      japaneseLevel: currentLevel,
      targetJlptLevel: targetLevel,
      learningGoal: profile.learningGoal,
    },
    skills: {
      vocabulary: { masteryPercent: skillProgress.vocabulary },
      grammar: { masteryPercent: skillProgress.grammar },
      kanji: { masteryPercent: skillProgress.kanji },
      reading: readingMetrics
        ? {
            masteryPercent: readingMetrics.masteryPercent,
            itemsStarted: readingMetrics.itemsStarted,
          }
        : null,
      listening: listeningMetrics
        ? {
            masteryPercent: listeningMetrics.masteryPercent,
            itemsStarted: listeningMetrics.itemsStarted,
          }
        : null,
    },
    weaknesses: weaknesses.map((item) => ({
      skill: item.skill,
      masteryPercent: item.masteryPercent,
    })),
    strengths: strengths.map((item) => ({
      skill: item.skill,
      masteryPercent: item.masteryPercent,
    })),
    practice: {
      recentAccuracy,
      sampleSize: recentAttempts.length,
    },
    assessment: assessment
      ? {
          latestScore: assessment.latestScore,
          bestScore: assessment.bestScore,
        }
      : null,
    continueLearning: recommendation
      ? {
          lessonTitle: recommendation.title,
          progressPercent: recommendation.progressPercent ?? 0,
        }
      : null,
  };
}

export function serializeLearnerContextForPrompt(context: TutorLearnerContext): string {
  return JSON.stringify(context);
}

export async function getUserLevelForGrounding(userId: string): Promise<JapaneseLevel> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { japaneseLevel: true },
  });
  return profile?.japaneseLevel ?? "N5";
}
