import type { MockExamSkill, PrismaClient } from "../../src/generated/prisma/client";

type QuestionSource =
  | { type: "exercise"; exerciseId: string }
  | { type: "reading"; readingQuestionId: string }
  | { type: "listening"; listeningQuestionId: string };

type SectionSeed = {
  title: string;
  skill: MockExamSkill;
  order: number;
  readingSlug?: string;
  listeningSlug?: string;
  questionSources: QuestionSource[];
};

type MockExamSeed = {
  title: string;
  slug: string;
  levelCode: "N5" | "N4";
  description: string;
  published: boolean;
  durationSeconds: number;
  sections: SectionSeed[];
};

export const MOCK_EXAMS: MockExamSeed[] = [
  {
    title: "N5 Mock Exam 1",
    slug: "n5-mock-exam-1",
    levelCode: "N5",
    description:
      "A practice mock exam covering N5 vocabulary, grammar, reading, and listening. This is not an official JLPT exam.",
    published: true,
    durationSeconds: 45 * 60,
    sections: [
      {
        title: "Vocabulary",
        skill: "VOCABULARY",
        order: 1,
        questionSources: [],
      },
      {
        title: "Grammar",
        skill: "GRAMMAR",
        order: 2,
        questionSources: [],
      },
      {
        title: "Reading",
        skill: "READING",
        order: 3,
        readingSlug: "my-sunday",
        questionSources: [],
      },
      {
        title: "Listening",
        skill: "LISTENING",
        order: 4,
        listeningSlug: "at-the-station",
        questionSources: [],
      },
    ],
  },
  {
    title: "N4 Mock Exam 1",
    slug: "n4-mock-exam-1",
    levelCode: "N4",
    description:
      "A practice mock exam covering N4 vocabulary, grammar, reading, and listening. This is not an official JLPT exam.",
    published: true,
    durationSeconds: 50 * 60,
    sections: [
      {
        title: "Vocabulary",
        skill: "VOCABULARY",
        order: 1,
        questionSources: [],
      },
      {
        title: "Grammar",
        skill: "GRAMMAR",
        order: 2,
        questionSources: [],
      },
      {
        title: "Reading",
        skill: "READING",
        order: 3,
        readingSlug: "weekend-in-kyoto",
        questionSources: [],
      },
      {
        title: "Listening",
        skill: "LISTENING",
        order: 4,
        listeningSlug: "job-interview",
        questionSources: [],
      },
    ],
  },
  {
    title: "N5 Mock Exam Draft",
    slug: "n5-mock-exam-draft",
    levelCode: "N5",
    description: "Draft mock exam for internal testing.",
    published: false,
    durationSeconds: 10 * 60,
    sections: [
      {
        title: "Vocabulary",
        skill: "VOCABULARY",
        order: 1,
        questionSources: [],
      },
    ],
  },
];

async function loadExerciseQuestions(
  prisma: PrismaClient,
  levelCode: "N5" | "N4",
  skill: "VOCABULARY" | "GRAMMAR",
  limit: number,
) {
  const preferredCategory = skill === "VOCABULARY" ? "VOCABULARY" : "GRAMMAR";
  let exercises = await prisma.exercise.findMany({
    where: {
      lesson: {
        published: true,
        category: preferredCategory,
        jlptLevel: { code: levelCode },
      },
    },
    orderBy: [{ lesson: { order: "asc" } }, { order: "asc" }],
    take: limit,
    select: {
      id: true,
      question: true,
      explanation: true,
      options: {
        orderBy: { order: "asc" },
        select: { text: true, isCorrect: true, order: true },
      },
    },
  });

  if (exercises.length < limit) {
    const mixedExercises = await prisma.exercise.findMany({
      where: {
        lesson: {
          published: true,
          category: "MIXED",
          jlptLevel: { code: levelCode },
        },
        id: { notIn: exercises.map((item) => item.id) },
      },
      orderBy: [{ lesson: { order: "asc" } }, { order: "asc" }],
      take: limit - exercises.length,
      select: {
        id: true,
        question: true,
        explanation: true,
        options: {
          orderBy: { order: "asc" },
          select: { text: true, isCorrect: true, order: true },
        },
      },
    });
    exercises = [...exercises, ...mixedExercises];
  }

  return exercises.map((exercise) => ({
    exerciseId: exercise.id,
    questionText: exercise.question,
    explanation: exercise.explanation,
    options: exercise.options,
  }));
}

async function loadReadingQuestions(
  prisma: PrismaClient,
  slug: string,
  limit: number,
) {
  const reading = await prisma.reading.findFirst({
    where: { slug, published: true },
    select: {
      id: true,
      questions: {
        orderBy: { order: "asc" },
        take: limit,
        select: {
          id: true,
          question: true,
          explanation: true,
          options: {
            orderBy: { order: "asc" },
            select: { text: true, isCorrect: true, order: true },
          },
        },
      },
    },
  });

  return {
    readingId: reading?.id ?? null,
    questions:
      reading?.questions.map((question) => ({
        readingQuestionId: question.id,
        questionText: question.question,
        explanation: question.explanation,
        options: question.options,
      })) ?? [],
  };
}

async function loadListeningQuestions(
  prisma: PrismaClient,
  slug: string,
  limit: number,
) {
  const listening = await prisma.listening.findFirst({
    where: { slug, published: true },
    select: {
      id: true,
      questions: {
        orderBy: { order: "asc" },
        take: limit,
        select: {
          id: true,
          question: true,
          explanation: true,
          options: {
            orderBy: { order: "asc" },
            select: { text: true, isCorrect: true, order: true },
          },
        },
      },
    },
  });

  return {
    listeningId: listening?.id ?? null,
    questions:
      listening?.questions.map((question) => ({
        listeningQuestionId: question.id,
        questionText: question.question,
        explanation: question.explanation,
        options: question.options,
      })) ?? [],
  };
}

export async function seedMockExams(prisma: PrismaClient) {
  console.log("\nSeeding mock exams...");

  for (const examSeed of MOCK_EXAMS) {
    const jlptLevel = await prisma.jlptLevel.findUnique({
      where: { code: examSeed.levelCode },
      select: { id: true },
    });
    if (!jlptLevel) {
      throw new Error(`JLPT level ${examSeed.levelCode} not found for mock exam seed.`);
    }

    const vocabQuestions = await loadExerciseQuestions(
      prisma,
      examSeed.levelCode,
      "VOCABULARY",
      5,
    );
    const grammarQuestions = await loadExerciseQuestions(
      prisma,
      examSeed.levelCode,
      "GRAMMAR",
      5,
    );

    const sectionsWithQuestions: Array<
      SectionSeed & {
        readingId?: string | null;
        listeningId?: string | null;
        questions: Array<{
          exerciseId?: string;
          readingQuestionId?: string;
          listeningQuestionId?: string;
          questionText: string;
          explanation: string | null;
          options: { text: string; isCorrect: boolean; order: number }[];
        }>;
      }
    > = [];

    for (const section of examSeed.sections) {
      if (section.skill === "VOCABULARY") {
        sectionsWithQuestions.push({
          ...section,
          questions: vocabQuestions.slice(0, examSeed.published ? 5 : 2),
        });
      } else if (section.skill === "GRAMMAR") {
        sectionsWithQuestions.push({
          ...section,
          questions: grammarQuestions.slice(0, examSeed.published ? 5 : 2),
        });
      } else if (section.skill === "READING" && section.readingSlug) {
        const reading = await loadReadingQuestions(prisma, section.readingSlug, 5);
        sectionsWithQuestions.push({
          ...section,
          readingId: reading.readingId,
          questions: reading.questions.slice(0, examSeed.published ? 5 : 2),
        });
      } else if (section.skill === "LISTENING" && section.listeningSlug) {
        const listening = await loadListeningQuestions(prisma, section.listeningSlug, 5);
        sectionsWithQuestions.push({
          ...section,
          listeningId: listening.listeningId,
          questions: listening.questions.slice(0, examSeed.published ? 5 : 2),
        });
      }
    }

    const questionCount = sectionsWithQuestions.reduce(
      (sum, section) => sum + section.questions.length,
      0,
    );

    const exam = await prisma.mockExam.upsert({
      where: { slug: examSeed.slug },
      update: {
        title: examSeed.title,
        description: examSeed.description,
        published: examSeed.published,
        durationSeconds: examSeed.durationSeconds,
        questionCount,
        jlptLevelId: jlptLevel.id,
      },
      create: {
        title: examSeed.title,
        slug: examSeed.slug,
        description: examSeed.description,
        published: examSeed.published,
        durationSeconds: examSeed.durationSeconds,
        questionCount,
        jlptLevelId: jlptLevel.id,
      },
    });

    for (const sectionSeed of sectionsWithQuestions) {
      const section = await prisma.mockExamSection.upsert({
        where: {
          mockExamId_order: {
            mockExamId: exam.id,
            order: sectionSeed.order,
          },
        },
        update: {
          title: sectionSeed.title,
          skill: sectionSeed.skill,
          readingId: sectionSeed.readingId ?? null,
          listeningId: sectionSeed.listeningId ?? null,
        },
        create: {
          mockExamId: exam.id,
          title: sectionSeed.title,
          skill: sectionSeed.skill,
          order: sectionSeed.order,
          readingId: sectionSeed.readingId ?? null,
          listeningId: sectionSeed.listeningId ?? null,
        },
      });

      for (const [index, questionSeed] of sectionSeed.questions.entries()) {
        const order = index + 1;
        const existing = await prisma.mockExamQuestion.findFirst({
          where: { sectionId: section.id, order },
          select: { id: true },
        });

        const question = existing
          ? await prisma.mockExamQuestion.update({
              where: { id: existing.id },
              data: {
                questionText: questionSeed.questionText,
                explanation: questionSeed.explanation,
                exerciseId:
                  "exerciseId" in questionSeed ? questionSeed.exerciseId : null,
                readingQuestionId:
                  "readingQuestionId" in questionSeed
                    ? questionSeed.readingQuestionId
                    : null,
                listeningQuestionId:
                  "listeningQuestionId" in questionSeed
                    ? questionSeed.listeningQuestionId
                    : null,
              },
            })
          : await prisma.mockExamQuestion.create({
              data: {
                sectionId: section.id,
                order,
                questionText: questionSeed.questionText,
                explanation: questionSeed.explanation,
                exerciseId:
                  "exerciseId" in questionSeed ? questionSeed.exerciseId : null,
                readingQuestionId:
                  "readingQuestionId" in questionSeed
                    ? questionSeed.readingQuestionId
                    : null,
                listeningQuestionId:
                  "listeningQuestionId" in questionSeed
                    ? questionSeed.listeningQuestionId
                    : null,
              },
            });

        for (const [optionIndex, optionSeed] of questionSeed.options.entries()) {
          const optionOrder = optionIndex + 1;
          const existingOption = await prisma.mockExamQuestionOption.findFirst({
            where: { questionId: question.id, order: optionOrder },
            select: { id: true },
          });

          if (existingOption) {
            await prisma.mockExamQuestionOption.update({
              where: { id: existingOption.id },
              data: {
                text: optionSeed.text,
                isCorrect: optionSeed.isCorrect,
              },
            });
          } else {
            await prisma.mockExamQuestionOption.create({
              data: {
                questionId: question.id,
                text: optionSeed.text,
                isCorrect: optionSeed.isCorrect,
                order: optionOrder,
              },
            });
          }
        }
      }
    }

    console.log(`  ✓ Mock Exam: ${examSeed.slug} (${questionCount} questions)`);
  }
}
