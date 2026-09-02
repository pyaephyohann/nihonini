import "server-only";

import type { JapaneseLevel } from "@/generated/prisma/client";
import { getWeakSkills } from "@/server/learning/analytics.service";
import { getDueReviewSummary } from "@/server/learning/daily-learning.service";
import {
  getNextRecommendedLesson,
  getJlptSkillProgress,
} from "@/server/learning/jlpt.service";
import { getListeningSkillMetrics, getRecentListeningActivity } from "@/server/learning/listening.service";
import { findPublishedMockExamsForLevel } from "@/server/learning/mock-exam.repository";
import { getMockExamAssessmentMetrics } from "@/server/learning/mock-exam.service";
import { getReadingSkillMetrics, getRecentReadingActivity } from "@/server/learning/reading.service";
import { findPublishedReadingsForLevel } from "@/server/learning/reading.repository";
import { findPublishedListeningsForLevel } from "@/server/learning/listening.repository";
import { prisma } from "@/server/db";
import type { TutorSuggestedActionType } from "@/lib/validations/tutor";
import {
  detectRecommendationIntent,
  parseTimeConstraintMinutes,
} from "@/server/tutor/recommendation/tutor-recommendation-intent";
import type {
  TutorRecommendationCandidate,
  TutorRecommendationContext,
  TutorRecommendationPriority,
} from "@/server/tutor/recommendation/tutor-recommendation.types";
import { stripRecommendationScores } from "@/server/tutor/recommendation/tutor-recommendation.types";

const MAX_RECOMMENDATIONS = 3;
const INACTIVITY_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function priorityFromScore(score: number): TutorRecommendationPriority {
  if (score >= 50) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

function weakSkillAction(skill: string): TutorSuggestedActionType {
  switch (skill.toUpperCase()) {
    case "VOCABULARY":
      return "PRACTICE_WEAK_VOCABULARY";
    case "GRAMMAR":
      return "PRACTICE_WEAK_GRAMMAR";
    case "KANJI":
      return "PRACTICE_WEAK_KANJI";
    default:
      return "PRACTICE_WEAK_SKILL";
  }
}

function weakSkillLabel(skill: string): string {
  switch (skill.toUpperCase()) {
    case "VOCABULARY":
      return "Practice vocabulary";
    case "GRAMMAR":
      return "Practice grammar";
    case "KANJI":
      return "Practice kanji";
    default:
      return "Start practice";
  }
}

function isInactive(lastActivityIso: string | undefined): boolean {
  if (!lastActivityIso) {
    return true;
  }
  const last = new Date(lastActivityIso).getTime();
  if (Number.isNaN(last)) {
    return true;
  }
  return Date.now() - last > INACTIVITY_DAYS * DAY_MS;
}

/** Prefer diverse activity types while keeping highest scores first. */
function applyRecommendationDiversity(
  candidates: TutorRecommendationCandidate[],
  max = MAX_RECOMMENDATIONS,
): TutorRecommendationCandidate[] {
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const selected: TutorRecommendationCandidate[] = [];
  const usedTypes = new Set<string>();

  for (const candidate of sorted) {
    if (selected.length >= max) {
      break;
    }
    if (!usedTypes.has(candidate.type)) {
      selected.push(candidate);
      usedTypes.add(candidate.type);
    }
  }

  for (const candidate of sorted) {
    if (selected.length >= max) {
      break;
    }
    if (!selected.some((item) => item.id === candidate.id)) {
      selected.push(candidate);
    }
  }

  return selected.slice(0, max);
}

function applyTimeConstraint(
  candidates: TutorRecommendationCandidate[],
  timeConstraintMinutes: number | null,
): TutorRecommendationCandidate[] {
  if (!timeConstraintMinutes) {
    return candidates;
  }

  const fitting = candidates.filter(
    (candidate) => candidate.estimatedMinutes <= timeConstraintMinutes,
  );

  if (fitting.length > 0) {
    return fitting;
  }

  return candidates.map((candidate) => ({
    ...candidate,
    estimatedMinutes: Math.min(candidate.estimatedMinutes, timeConstraintMinutes),
    reason: `${candidate.reason} (adjusted for your ${timeConstraintMinutes}-minute session)`,
  }));
}

async function buildWeakSkillPracticeCandidates(
  userId: string,
  level: JapaneseLevel,
): Promise<TutorRecommendationCandidate[]> {
  const weaknesses = await getWeakSkills(userId, level, 3);
  return weaknesses.map((weakness, index) => {
    const masteryGap = Math.max(0, 100 - weakness.masteryPercent);
    return {
      id: `practice-weak-${weakness.skill.toLowerCase()}`,
      type: "PRACTICE" as const,
      title: `${weakness.skill.charAt(0)}${weakness.skill.slice(1).toLowerCase()} practice`,
      reason: `Your ${weakness.skill.toLowerCase()} mastery is ${weakness.masteryPercent}% at ${level} — extra practice would help.`,
      priority: priorityFromScore(masteryGap),
      estimatedMinutes: 10,
      targetSkill: weakness.skill,
      suggestedAction: {
        type: weakSkillAction(weakness.skill),
        label: weakSkillLabel(weakness.skill),
      },
      score: masteryGap * 1.5 + (3 - index) * 5,
    };
  });
}

async function buildReviewCandidate(userId: string): Promise<TutorRecommendationCandidate | null> {
  const dueReviews = await getDueReviewSummary(userId);
  if (dueReviews.total <= 0) {
    return null;
  }

  const estimatedMinutes = Math.min(20, Math.max(5, dueReviews.total));
  return {
    id: "review-due-items",
    type: "REVIEW",
    title: "Review due items",
    reason: `You have ${dueReviews.total} item${dueReviews.total === 1 ? "" : "s"} due for review (vocab ${dueReviews.vocabulary}, grammar ${dueReviews.grammar}, kanji ${dueReviews.kanji}).`,
    priority: dueReviews.total >= 10 ? "HIGH" : "MEDIUM",
    estimatedMinutes,
    suggestedAction: { type: "OPEN_PRACTICE", label: "Start review" },
    score: Math.min(60, 25 + dueReviews.total * 2),
  };
}

async function buildLessonCandidate(userId: string): Promise<TutorRecommendationCandidate | null> {
  const lesson = await getNextRecommendedLesson(userId);
  if (!lesson) {
    return null;
  }

  const inProgress = lesson.lessonStatus === "IN_PROGRESS";
  return {
    id: `lesson-${lesson.id}`,
    type: "LESSON",
    contentId: lesson.slug,
    title: lesson.title,
    reason: inProgress
      ? `Continue your in-progress lesson (${lesson.progressPercent ?? 0}% complete).`
      : `This is your next recommended lesson for ${lesson.jlptLevel}.`,
    priority: inProgress ? "HIGH" : "MEDIUM",
    estimatedMinutes: Math.max(5, lesson.estimatedMinutes ?? 15),
    suggestedAction: {
      type: inProgress ? "CONTINUE_LEARNING" : "OPEN_LESSON",
      label: inProgress ? "Continue lesson" : "Open lesson",
    },
    score: inProgress ? 55 : 40,
  };
}

async function buildReadingCandidate(
  userId: string,
  level: JapaneseLevel,
): Promise<TutorRecommendationCandidate | null> {
  const [metrics, recent, readings] = await Promise.all([
    getReadingSkillMetrics(userId, level),
    getRecentReadingActivity(userId, 1),
    findPublishedReadingsForLevel(level),
  ]);

  if (!readings.length) {
    return null;
  }

  const lastActivity = recent[0]?.occurredAt;
  const inactive = isInactive(lastActivity);
  const lowMastery = metrics && metrics.masteryPercent !== null && metrics.masteryPercent < 50;

  if (!inactive && !lowMastery) {
    return null;
  }

  const pick = readings[0];
  const reason = lastActivity
    ? `No reading activity recently — a short reading session would balance your study.`
    : `You haven't started reading at ${level} yet — try a short passage.`;

  return {
    id: `reading-${pick.slug}`,
    type: "READING",
    contentId: pick.slug,
    title: pick.title,
    reason,
    priority: inactive && !lastActivity ? "MEDIUM" : "LOW",
    estimatedMinutes: Math.max(5, pick.estimatedMinutes ?? 10),
    targetSkill: "READING",
    suggestedAction: { type: "OPEN_READING", label: "Start reading" },
    score: inactive ? 35 : 25,
  };
}

async function buildListeningCandidate(
  userId: string,
  level: JapaneseLevel,
): Promise<TutorRecommendationCandidate | null> {
  const [metrics, recent, listenings] = await Promise.all([
    getListeningSkillMetrics(userId, level),
    getRecentListeningActivity(userId, 1),
    findPublishedListeningsForLevel(level),
  ]);

  if (!listenings.length) {
    return null;
  }

  const lastActivity = recent[0]?.occurredAt;
  const inactive = isInactive(lastActivity);
  const lowMastery =
    metrics && metrics.masteryPercent !== null && metrics.masteryPercent < 50;

  if (!inactive && !lowMastery) {
    return null;
  }

  const pick = listenings[0];
  const reason = lastActivity
    ? `No listening activity recently — a short listening exercise would help.`
    : `You haven't started listening at ${level} yet — try an audio exercise.`;

  return {
    id: `listening-${pick.slug}`,
    type: "LISTENING",
    contentId: pick.slug,
    title: pick.title,
    reason,
    priority: inactive && !lastActivity ? "MEDIUM" : "LOW",
    estimatedMinutes: Math.max(5, pick.estimatedMinutes ?? 10),
    targetSkill: "LISTENING",
    suggestedAction: { type: "OPEN_LISTENING", label: "Start listening" },
    score: inactive ? 32 : 22,
  };
}

async function buildMockExamCandidate(
  userId: string,
  targetLevel: JapaneseLevel,
): Promise<TutorRecommendationCandidate | null> {
  const [exams, assessment] = await Promise.all([
    findPublishedMockExamsForLevel(targetLevel),
    getMockExamAssessmentMetrics(userId),
  ]);

  if (!exams.length) {
    return null;
  }

  const pick = exams[0];
  const needsExam =
    !assessment || assessment.latestScore < 70 || assessment.attemptCount < 1;

  if (!needsExam) {
    return null;
  }

  const durationMinutes = Math.max(15, Math.round(pick.durationSeconds / 60));
  return {
    id: `mock-exam-${pick.slug}`,
    type: "MOCK_EXAM",
    contentId: pick.slug,
    title: pick.title,
    reason: assessment
      ? `Your latest mock exam score is ${assessment.latestScore}% — another attempt at ${targetLevel} would show progress.`
      : `You haven't taken a ${targetLevel} mock exam yet — it helps gauge exam readiness.`,
    priority: !assessment ? "MEDIUM" : "LOW",
    estimatedMinutes: durationMinutes,
    suggestedAction: { type: "OPEN_MOCK_EXAM", label: "Take mock exam" },
    score: !assessment ? 30 : 20,
  };
}

async function buildTutorPracticeCandidate(
  userId: string,
  level: JapaneseLevel,
): Promise<TutorRecommendationCandidate | null> {
  const weaknesses = await getWeakSkills(userId, level, 1);
  if (!weaknesses.length) {
    return null;
  }

  const weak = weaknesses[0];
  return {
    id: "tutor-guided-practice",
    type: "TUTOR_PRACTICE",
    title: "Tutor-guided practice",
    reason: `Ask me for guided practice on ${weak.skill.toLowerCase()} — I'll coach you through questions without affecting official progress.`,
    priority: "LOW",
    estimatedMinutes: 10,
    targetSkill: weak.skill,
    suggestedAction: { type: "OPEN_PRACTICE", label: "Official practice" },
    score: 15,
  };
}

export async function generateTutorRecommendationCandidates(
  userId: string,
  options?: { timeConstraintMinutes?: number | null },
): Promise<TutorRecommendationCandidate[]> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { japaneseLevel: true, targetJlptLevel: true },
  });

  if (!profile) {
    return [];
  }

  const currentLevel = profile.japaneseLevel;
  const targetLevel = profile.targetJlptLevel ?? currentLevel;

  const [
    weakPractice,
    review,
    lesson,
    reading,
    listening,
    mockExam,
    tutorPractice,
    targetProgress,
  ] = await Promise.all([
    buildWeakSkillPracticeCandidates(userId, targetLevel),
    buildReviewCandidate(userId),
    buildLessonCandidate(userId),
    buildReadingCandidate(userId, targetLevel),
    buildListeningCandidate(userId, targetLevel),
    buildMockExamCandidate(userId, targetLevel),
    buildTutorPracticeCandidate(userId, targetLevel),
    getJlptSkillProgress(userId, targetLevel),
  ]);

  const candidates: TutorRecommendationCandidate[] = [...weakPractice];

  if (review) candidates.push(review);
  if (lesson) candidates.push(lesson);
  if (reading) candidates.push(reading);
  if (listening) candidates.push(listening);
  if (mockExam) candidates.push(mockExam);
  if (tutorPractice) candidates.push(tutorPractice);

  // Boost candidates aligned with lowest target-level skill.
  const skillScores = [
    { skill: "vocabulary", value: targetProgress.vocabulary },
    { skill: "grammar", value: targetProgress.grammar },
    { skill: "kanji", value: targetProgress.kanji },
  ];
  const lowest = [...skillScores].sort((a, b) => a.value - b.value)[0];
  if (lowest) {
    for (const candidate of candidates) {
      if (
        candidate.targetSkill?.toLowerCase() === lowest.skill ||
        candidate.id.includes(lowest.skill)
      ) {
        candidate.score += 8;
        candidate.priority = priorityFromScore(candidate.score);
      }
    }
  }

  const timeFiltered = applyTimeConstraint(
    candidates,
    options?.timeConstraintMinutes ?? null,
  );

  return applyRecommendationDiversity(timeFiltered);
}

export type TutorRecommendationBundle = {
  context: TutorRecommendationContext;
  candidates: TutorRecommendationCandidate[];
};

export async function buildTutorRecommendationContext(
  userId: string,
  userMessage: string,
): Promise<TutorRecommendationBundle | null> {
  if (!detectRecommendationIntent(userMessage)) {
    return null;
  }

  const timeConstraintMinutes = parseTimeConstraintMinutes(userMessage);

  try {
    const ranked = await generateTutorRecommendationCandidates(userId, {
      timeConstraintMinutes,
    });

    if (ranked.length === 0) {
      return null;
    }

    return {
      context: {
        mode: "PERSONALIZED_RECOMMENDATIONS",
        timeConstraintMinutes,
        trustedCandidates: stripRecommendationScores(ranked),
      },
      candidates: ranked,
    };
  } catch {
    return null;
  }
}

/** Exposed for QA — full candidate list with scores. */
export { generateTutorRecommendationCandidates as generateRecommendationCandidatesForTests };
