import "server-only";

import type { MockExamSessionStatus } from "@/generated/prisma/client";
import {
  saveMockExamAnswerSchema,
  startMockExamSessionSchema,
  submitMockExamSessionSchema,
} from "@/lib/validations/mock-exam";
import {
  findActiveSessionForExam,
  findLatestMockExamSession,
  findMockExamAssessmentMetrics,
  findMockExamForSessionStart,
  findPublishedMockExamBySlug,
  findPublishedMockExamsForLevel,
  findSessionById,
  findSessionForGrading,
  findSessionForTaking,
  findUserMockExamHistory,
} from "@/server/learning/mock-exam.repository";
import { prisma } from "@/server/db";
import type {
  MockExamCatalogLevel,
  MockExamDetail,
  MockExamHistoryItem,
  MockExamListItem,
  MockExamResult,
  MockExamSessionState,
} from "@/types/learning";

const LEVEL_SEQUENCE = ["N5", "N4", "N3", "N2", "N1"] as const;

function calculateScorePercent(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round(Math.min(100, Math.max(0, (correct / total) * 100)));
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  return `${mins} min`;
}

function mapListItem(
  exam: Awaited<ReturnType<typeof findPublishedMockExamsForLevel>>[number],
  activeSessionId?: string | null,
): MockExamListItem {
  return {
    id: exam.id,
    title: exam.title,
    slug: exam.slug,
    description: exam.description,
    jlptLevel: exam.jlptLevel.code,
    durationSeconds: exam.durationSeconds,
    durationLabel: formatDuration(exam.durationSeconds),
    questionCount: exam.questionCount,
    activeSessionId: activeSessionId ?? null,
  };
}

async function loadCatalog(userId: string): Promise<MockExamCatalogLevel[]> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { japaneseLevel: true, targetJlptLevel: true },
  });
  const currentLevel = profile?.japaneseLevel ?? "N5";
  const targetLevel = profile?.targetJlptLevel ?? currentLevel;
  const currentIndex = LEVEL_SEQUENCE.indexOf(currentLevel);
  const targetIndex = LEVEL_SEQUENCE.indexOf(targetLevel);
  const path =
    currentIndex === -1 || targetIndex === -1
      ? [currentLevel]
      : LEVEL_SEQUENCE.slice(
          Math.min(currentIndex, targetIndex),
          Math.max(currentIndex, targetIndex) + 1,
        );

  const levels: MockExamCatalogLevel[] = [];

  for (const level of path) {
    const exams = await findPublishedMockExamsForLevel(level);
    const items: MockExamListItem[] = [];

    for (const exam of exams) {
      const active = await findActiveSessionForExam(userId, exam.id);
      items.push(mapListItem(exam, active?.id));
    }

    levels.push({ level, exams: items });
  }

  return levels;
}

export async function getMockExamCatalog(userId: string): Promise<MockExamCatalogLevel[]> {
  return loadCatalog(userId);
}

export async function getMockExamBySlug(
  userId: string,
  slug: string,
): Promise<MockExamDetail | null> {
  const exam = await findPublishedMockExamBySlug(slug);
  if (!exam) return null;

  const active = await findActiveSessionForExam(userId, exam.id);

  return {
    id: exam.id,
    title: exam.title,
    slug: exam.slug,
    description: exam.description,
    jlptLevel: exam.jlptLevel.code,
    jlptLevelName: exam.jlptLevel.name,
    durationSeconds: exam.durationSeconds,
    durationLabel: formatDuration(exam.durationSeconds),
    questionCount: exam.questionCount,
    activeSessionId: active?.id ?? null,
    sections: exam.sections.map((section) => ({
      id: section.id,
      title: section.title,
      skill: section.skill,
      order: section.order,
      questionCount: section.questions.length,
      durationSeconds: section.durationSeconds,
    })),
  };
}

export async function startMockExamSession(input: {
  userId: string;
  payload: unknown;
}): Promise<{ sessionId: string } | { error: string }> {
  const parsed = startMockExamSessionSchema.safeParse(input.payload);
  if (!parsed.success) {
    return { error: "Invalid exam start request." };
  }

  const exam = await findMockExamForSessionStart(parsed.data.mockExamId);
  if (!exam) {
    return { error: "Mock exam not found." };
  }

  const existing = await findActiveSessionForExam(input.userId, exam.id);
  if (existing) {
    const session = await findSessionById(existing.id);
    if (session && session.status === "IN_PROGRESS") {
      const expired = await maybeExpireSession(session.id, input.userId);
      if (expired) {
        return { error: "Your previous exam session has expired. Please start a new attempt." };
      }
      return { sessionId: existing.id };
    }
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + exam.durationSeconds * 1000);

  const sessionQuestions = exam.sections.flatMap((section) =>
    section.questions.map((question, index) => ({
      mockExamQuestionId: question.id,
      sectionId: section.id,
      order:
        exam.sections
          .slice(0, exam.sections.findIndex((item) => item.id === section.id))
          .reduce((sum, item) => sum + item.questions.length, 0) + index,
    })),
  );

  const session = await prisma.userMockExamSession.create({
    data: {
      userId: input.userId,
      mockExamId: exam.id,
      status: "IN_PROGRESS",
      startedAt: now,
      expiresAt,
      sessionQuestions: {
        create: sessionQuestions,
      },
    },
    select: { id: true },
  });

  return { sessionId: session.id };
}

async function maybeExpireSession(
  sessionId: string,
  userId: string,
): Promise<boolean> {
  const session = await findSessionById(sessionId);
  if (!session || session.userId !== userId) return false;
  if (session.status !== "IN_PROGRESS") return session.status === "EXPIRED";

  if (new Date() >= session.expiresAt) {
    await finalizeSession(sessionId, userId, "EXPIRED");
    return true;
  }

  return false;
}

async function ensureSessionAccess(
  sessionId: string,
  userId: string,
): Promise<
  | { error: string }
  | { session: NonNullable<Awaited<ReturnType<typeof findSessionById>>> }
> {
  const session = await findSessionById(sessionId);
  if (!session) {
    return { error: "Exam session not found." };
  }
  if (session.userId !== userId) {
    return { error: "You do not have access to this exam session." };
  }
  return { session };
}

function buildSessionState(
  session: NonNullable<Awaited<ReturnType<typeof findSessionForTaking>>>,
): MockExamSessionState {
  const answers = Object.fromEntries(
    session.answers.map((answer) => [answer.mockExamQuestionId, answer.selectedOptionId]),
  );

  const questions = session.sessionQuestions.map((item, index) => ({
    id: item.mockExamQuestion.id,
    globalIndex: index,
    sectionId: item.sectionId,
    questionText: item.mockExamQuestion.questionText,
    questionType: item.mockExamQuestion.questionType,
    order: item.order,
    options: item.mockExamQuestion.options,
    selectedOptionId: answers[item.mockExamQuestionId] ?? null,
  }));

  const sections = session.mockExam.sections.map((section) => ({
    id: section.id,
    title: section.title,
    skill: section.skill,
    order: section.order,
    readingPassage: section.reading?.passage ?? null,
    readingTitle: section.reading?.title ?? null,
    listeningAudioUrl: section.listening?.audioUrl ?? null,
    listeningTitle: section.listening?.title ?? null,
    listeningDurationSeconds: section.listening?.durationSeconds ?? null,
    questionIds: questions.filter((q) => q.sectionId === section.id).map((q) => q.id),
  }));

  return {
    sessionId: session.id,
    status: "IN_PROGRESS" as const,
    startedAt: session.startedAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    serverNow: new Date().toISOString(),
    exam: {
      id: session.mockExam.id,
      title: session.mockExam.title,
      slug: session.mockExam.slug,
      jlptLevel: session.mockExam.jlptLevel.code,
      durationSeconds: session.mockExam.durationSeconds,
    },
    sections,
    questions,
    answeredCount: session.answers.length,
    totalCount: questions.length,
  };
}

export async function getMockExamSessionState(input: {
  userId: string;
  sessionId: string;
}): Promise<MockExamSessionState | MockExamResult | { error: string }> {
  const access = await ensureSessionAccess(input.sessionId, input.userId);
  if ("error" in access) return access;

  if (access.session.status === "IN_PROGRESS") {
    const expired = await maybeExpireSession(input.sessionId, input.userId);
    if (expired) {
      return getMockExamResult({ userId: input.userId, sessionId: input.sessionId });
    }
  }

  if (access.session.status === "SUBMITTED" || access.session.status === "EXPIRED") {
    return getMockExamResult({ userId: input.userId, sessionId: input.sessionId });
  }

  const session = await findSessionForTaking(input.sessionId);
  if (!session) {
    return { error: "Exam session not found." };
  }

  return buildSessionState(session);
}

export async function saveMockExamAnswer(input: {
  userId: string;
  payload: unknown;
}): Promise<{ saved: true; answeredAt: string } | { error: string }> {
  const parsed = saveMockExamAnswerSchema.safeParse(input.payload);
  if (!parsed.success) {
    return { error: "Invalid answer payload." };
  }

  const { sessionId, questionId, selectedOptionId } = parsed.data;
  const access = await ensureSessionAccess(sessionId, input.userId);
  if ("error" in access) return access;

  if (access.session.status !== "IN_PROGRESS") {
    return { error: "This exam session is no longer active." };
  }

  if (new Date() >= access.session.expiresAt) {
    await finalizeSession(sessionId, input.userId, "EXPIRED");
    return { error: "Time is up. This exam session has expired." };
  }

  const sessionQuestion = await prisma.userMockExamSessionQuestion.findFirst({
    where: { sessionId, mockExamQuestionId: questionId },
    select: { id: true },
  });
  if (!sessionQuestion) {
    return { error: "Question does not belong to this exam session." };
  }

  const option = await prisma.mockExamQuestionOption.findFirst({
    where: { id: selectedOptionId, questionId },
    select: { id: true },
  });
  if (!option) {
    return { error: "Invalid answer option." };
  }

  const answeredAt = new Date();
  await prisma.userMockExamAnswer.upsert({
    where: {
      sessionId_mockExamQuestionId: {
        sessionId,
        mockExamQuestionId: questionId,
      },
    },
    create: {
      sessionId,
      mockExamQuestionId: questionId,
      selectedOptionId,
      answeredAt,
    },
    update: {
      selectedOptionId,
      answeredAt,
    },
  });

  return { saved: true, answeredAt: answeredAt.toISOString() };
}

async function gradeSession(
  session: NonNullable<Awaited<ReturnType<typeof findSessionForGrading>>>,
) {
  const answerMap = new Map(
    session.answers.map((answer) => [answer.mockExamQuestionId, answer.selectedOptionId]),
  );

  const gradedQuestions = session.sessionQuestions.map((item) => {
    const question = item.mockExamQuestion;
    const selectedOptionId = answerMap.get(question.id) ?? null;
    const selectedOption = question.options.find((option) => option.id === selectedOptionId);
    const correctOption = question.options.find((option) => option.isCorrect);
    const isCorrect = selectedOption?.isCorrect ?? false;

    return {
      questionId: question.id,
      sectionId: item.sectionId,
      order: item.order,
      questionText: question.questionText,
      selectedOptionId,
      selectedOptionText: selectedOption?.text ?? null,
      correctOptionId: correctOption?.id ?? "",
      correctOptionText: correctOption?.text ?? "",
      isCorrect,
      explanation: question.explanation,
    };
  });

  const totalCount = gradedQuestions.length;
  const correctCount = gradedQuestions.filter((item) => item.isCorrect).length;
  const scorePercent = calculateScorePercent(correctCount, totalCount);

  const sectionIds = [...new Set(gradedQuestions.map((item) => item.sectionId))];
  const sectionResults = sectionIds.map((sectionId) => {
    const sectionQuestions = gradedQuestions.filter((item) => item.sectionId === sectionId);
    const sectionCorrect = sectionQuestions.filter((item) => item.isCorrect).length;
    const sectionTotal = sectionQuestions.length;
    return {
      sectionId,
      correctCount: sectionCorrect,
      totalCount: sectionTotal,
      scorePercent: calculateScorePercent(sectionCorrect, sectionTotal),
    };
  });

  return {
    gradedQuestions,
    totalCount,
    correctCount,
    scorePercent,
    sectionResults,
  };
}

async function finalizeSession(
  sessionId: string,
  userId: string,
  finalStatus: Extract<MockExamSessionStatus, "SUBMITTED" | "EXPIRED">,
): Promise<MockExamResult | { error: string }> {
  const access = await ensureSessionAccess(sessionId, userId);
  if ("error" in access) return access;

  if (access.session.status === "SUBMITTED" || access.session.status === "EXPIRED") {
    return getMockExamResult({ userId, sessionId });
  }

  const session = await findSessionForGrading(sessionId);
  if (!session) {
    return { error: "Exam session not found." };
  }

  const graded = await gradeSession(session);
  const submittedAt = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.userMockExamSession.updateMany({
      where: { id: sessionId, status: "IN_PROGRESS" },
      data: {
        status: finalStatus,
        submittedAt,
        scorePercent: graded.scorePercent,
        correctCount: graded.correctCount,
        totalCount: graded.totalCount,
      },
    });

    if (result.count === 0) {
      return false;
    }

    for (const sectionResult of graded.sectionResults) {
      await tx.userMockExamSectionResult.upsert({
        where: {
          sessionId_sectionId: {
            sessionId,
            sectionId: sectionResult.sectionId,
          },
        },
        create: {
          sessionId,
          sectionId: sectionResult.sectionId,
          correctCount: sectionResult.correctCount,
          totalCount: sectionResult.totalCount,
          scorePercent: sectionResult.scorePercent,
        },
        update: {
          correctCount: sectionResult.correctCount,
          totalCount: sectionResult.totalCount,
          scorePercent: sectionResult.scorePercent,
        },
      });
    }

    return true;
  });

  if (!updated) {
    return getMockExamResult({ userId, sessionId });
  }

  return getMockExamResult({ userId, sessionId });
}

export async function submitMockExamSession(input: {
  userId: string;
  payload: unknown;
}): Promise<MockExamResult | { error: string }> {
  const parsed = submitMockExamSessionSchema.safeParse(input.payload);
  if (!parsed.success) {
    return { error: "Invalid submission request." };
  }

  return finalizeSession(parsed.data.sessionId, input.userId, "SUBMITTED");
}

export async function getMockExamResult(input: {
  userId: string;
  sessionId: string;
}): Promise<MockExamResult | { error: string }> {
  const access = await ensureSessionAccess(input.sessionId, input.userId);
  if ("error" in access) return access;

  const session = await findSessionForGrading(input.sessionId);
  if (!session) {
    return { error: "Exam session not found." };
  }

  if (session.status === "IN_PROGRESS") {
    return { error: "This exam has not been submitted yet." };
  }

  const graded = await gradeSession(session);
  const sectionMeta = await prisma.mockExamSection.findMany({
    where: { mockExamId: session.mockExamId },
    orderBy: { order: "asc" },
    select: { id: true, title: true, skill: true, order: true },
  });

  const sectionPerformance = sectionMeta.map((section) => {
    const result = graded.sectionResults.find((item) => item.sectionId === section.id);
    return {
      sectionId: section.id,
      title: section.title,
      skill: section.skill,
      order: section.order,
      correctCount: result?.correctCount ?? 0,
      totalCount: result?.totalCount ?? 0,
      scorePercent: result?.scorePercent ?? 0,
    };
  });

  return {
    sessionId: session.id,
    status: session.status,
    examTitle: session.mockExam.title,
    examSlug: session.mockExam.slug,
    jlptLevel: session.mockExam.jlptLevel.code,
    submittedAt: access.session.submittedAt?.toISOString() ?? new Date().toISOString(),
    scorePercent: access.session.scorePercent ?? graded.scorePercent,
    correctCount: access.session.correctCount ?? graded.correctCount,
    totalCount: access.session.totalCount ?? graded.totalCount,
    scoreLabel: "Mock Exam Score",
    sectionPerformance,
    answers: graded.gradedQuestions,
  };
}

export async function getMockExamHistory(userId: string): Promise<MockExamHistoryItem[]> {
  const history = await findUserMockExamHistory(userId);
  return history.map((item) => ({
    sessionId: item.id,
    examTitle: item.mockExam.title,
    examSlug: item.mockExam.slug,
    jlptLevel: item.mockExam.jlptLevel.code,
    status: item.status as "SUBMITTED" | "EXPIRED",
    scorePercent: item.scorePercent ?? 0,
    correctCount: item.correctCount ?? 0,
    totalCount: item.totalCount ?? 0,
    submittedAt: item.submittedAt?.toISOString() ?? "",
  }));
}

export async function getLatestMockExamSummary(userId: string) {
  const latest = await findLatestMockExamSession(userId);
  if (!latest || latest.scorePercent === null) return null;

  return {
    sessionId: latest.id,
    examTitle: latest.mockExam.title,
    examSlug: latest.mockExam.slug,
    jlptLevel: latest.mockExam.jlptLevel.code,
    scorePercent: latest.scorePercent,
    submittedAt: latest.submittedAt?.toISOString() ?? "",
  };
}

export async function getMockExamAssessmentMetrics(userId: string) {
  return findMockExamAssessmentMetrics(userId);
}

export async function abandonMockExamSession(input: {
  userId: string;
  sessionId: string;
}): Promise<MockExamResult | { error: string }> {
  const access = await ensureSessionAccess(input.sessionId, input.userId);
  if ("error" in access) return access;

  if (access.session.status !== "IN_PROGRESS") {
    return { error: "Only active exam sessions can be abandoned." };
  }

  return finalizeSession(input.sessionId, input.userId, "EXPIRED");
}
