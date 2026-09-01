import "server-only";

import type { JapaneseLevel, MockExamSessionStatus } from "@/generated/prisma/client";
import { prisma } from "@/server/db";

export async function findPublishedMockExamsForLevel(level: JapaneseLevel) {
  return prisma.mockExam.findMany({
    where: {
      published: true,
      jlptLevel: { code: level },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      durationSeconds: true,
      questionCount: true,
      jlptLevel: { select: { code: true } },
    },
  });
}

export async function findPublishedMockExamBySlug(slug: string) {
  return prisma.mockExam.findFirst({
    where: { slug, published: true },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      durationSeconds: true,
      questionCount: true,
      jlptLevel: { select: { code: true, name: true } },
      sections: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          skill: true,
          order: true,
          durationSeconds: true,
          readingId: true,
          listeningId: true,
          questions: {
            orderBy: { order: "asc" },
            select: { id: true },
          },
        },
      },
    },
  });
}

export async function findMockExamForSessionStart(mockExamId: string) {
  return prisma.mockExam.findFirst({
    where: { id: mockExamId, published: true },
    select: {
      id: true,
      title: true,
      slug: true,
      durationSeconds: true,
      questionCount: true,
      jlptLevel: { select: { code: true } },
      sections: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          skill: true,
          order: true,
          questions: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              order: true,
              sectionId: true,
            },
          },
        },
      },
    },
  });
}

export async function findActiveSessionForExam(userId: string, mockExamId: string) {
  return prisma.userMockExamSession.findFirst({
    where: {
      userId,
      mockExamId,
      status: "IN_PROGRESS",
    },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });
}

export async function findSessionById(sessionId: string) {
  return prisma.userMockExamSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      userId: true,
      mockExamId: true,
      status: true,
      startedAt: true,
      submittedAt: true,
      expiresAt: true,
      scorePercent: true,
      correctCount: true,
      totalCount: true,
      mockExam: {
        select: {
          id: true,
          title: true,
          slug: true,
          durationSeconds: true,
          jlptLevel: { select: { code: true } },
        },
      },
    },
  });
}

export async function findSessionForTaking(sessionId: string) {
  return prisma.userMockExamSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      userId: true,
      mockExamId: true,
      status: true,
      startedAt: true,
      submittedAt: true,
      expiresAt: true,
      scorePercent: true,
      correctCount: true,
      totalCount: true,
      mockExam: {
        select: {
          id: true,
          title: true,
          slug: true,
          durationSeconds: true,
          jlptLevel: { select: { code: true } },
          sections: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              skill: true,
              order: true,
              reading: {
                select: {
                  id: true,
                  title: true,
                  passage: true,
                },
              },
              listening: {
                select: {
                  id: true,
                  title: true,
                  audioUrl: true,
                  durationSeconds: true,
                },
              },
            },
          },
        },
      },
      sessionQuestions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          mockExamQuestionId: true,
          sectionId: true,
          order: true,
          mockExamQuestion: {
            select: {
              id: true,
              questionText: true,
              questionType: true,
              order: true,
              sectionId: true,
              options: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  text: true,
                  order: true,
                },
              },
            },
          },
        },
      },
      answers: {
        select: {
          mockExamQuestionId: true,
          selectedOptionId: true,
          answeredAt: true,
        },
      },
    },
  });
}

export async function findSessionForGrading(sessionId: string) {
  return prisma.userMockExamSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      userId: true,
      status: true,
      expiresAt: true,
      mockExamId: true,
      mockExam: {
        select: {
          title: true,
          slug: true,
          jlptLevel: { select: { code: true } },
        },
      },
      sessionQuestions: {
        orderBy: { order: "asc" },
        select: {
          mockExamQuestionId: true,
          sectionId: true,
          order: true,
          mockExamQuestion: {
            select: {
              id: true,
              questionText: true,
              explanation: true,
              sectionId: true,
              options: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  text: true,
                  isCorrect: true,
                  order: true,
                },
              },
            },
          },
        },
      },
      answers: {
        select: {
          mockExamQuestionId: true,
          selectedOptionId: true,
        },
      },
    },
  });
}

export async function findUserMockExamHistory(userId: string, limit = 20) {
  return prisma.userMockExamSession.findMany({
    where: {
      userId,
      status: { in: ["SUBMITTED", "EXPIRED"] },
    },
    orderBy: { submittedAt: "desc" },
    take: limit,
    select: {
      id: true,
      status: true,
      submittedAt: true,
      scorePercent: true,
      correctCount: true,
      totalCount: true,
      mockExam: {
        select: {
          title: true,
          slug: true,
          jlptLevel: { select: { code: true } },
        },
      },
    },
  });
}

export async function findLatestMockExamSession(userId: string) {
  return prisma.userMockExamSession.findFirst({
    where: {
      userId,
      status: { in: ["SUBMITTED", "EXPIRED"] },
    },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      scorePercent: true,
      submittedAt: true,
      mockExam: {
        select: {
          title: true,
          slug: true,
          jlptLevel: { select: { code: true } },
        },
      },
    },
  });
}

export async function findMockExamAssessmentMetrics(userId: string) {
  const sessions = await prisma.userMockExamSession.findMany({
    where: {
      userId,
      status: { in: ["SUBMITTED", "EXPIRED"] },
      scorePercent: { not: null },
    },
    select: { scorePercent: true },
    orderBy: { submittedAt: "desc" },
  });

  if (sessions.length === 0) {
    return null;
  }

  const scores = sessions.map((session) => session.scorePercent ?? 0);
  const latestScore = scores[0] ?? 0;
  const bestScore = Math.max(...scores);
  const averageScore = Math.round(
    scores.reduce((sum, score) => sum + score, 0) / scores.length,
  );

  return {
    attemptCount: scores.length,
    latestScore,
    bestScore,
    averageScore,
  };
}

export async function updateSessionStatus(
  sessionId: string,
  status: MockExamSessionStatus,
  data?: {
    submittedAt?: Date;
    scorePercent?: number;
    correctCount?: number;
    totalCount?: number;
  },
) {
  return prisma.userMockExamSession.updateMany({
    where: { id: sessionId, status: "IN_PROGRESS" },
    data: {
      status,
      submittedAt: data?.submittedAt,
      scorePercent: data?.scorePercent,
      correctCount: data?.correctCount,
      totalCount: data?.totalCount,
    },
  });
}
