/**
 * Seed Tutor browser QA data — run: npx tsx scripts/seed-browser-tutor-qa.ts
 */
import Module from "node:module";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const originalLoad = (Module as unknown as { _load: Function })._load;
(Module as unknown as { _load: Function })._load = function (
  request: string,
  parent: unknown,
  isMain: boolean,
) {
  if (request === "server-only") return {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (originalLoad as any).call(this, request, parent, isMain);
};

const BROWSER_EMAIL = "m965browser@example.com";

async function main() {
  const bcrypt = await import("bcrypt");
  const { prisma } = await import("../src/server/db");
  const { prepareTutorResponseForClient } = await import(
    "../src/server/tutor/tutor-safety"
  );

  let user = await prisma.user.findUnique({
    where: { email: BROWSER_EMAIL },
    select: { id: true },
  });

  if (!user) {
    const passwordHash = await bcrypt.hash("TestPass123!", 12);
    user = await prisma.user.create({
      data: {
        email: BROWSER_EMAIL,
        passwordHash,
        profile: {
          create: {
            displayName: "M965 Browser",
            japaneseLevel: "N5",
            targetJlptLevel: "N5",
            learningGoal: "JLPT",
            dailyGoal: 10,
          },
        },
      },
      select: { id: true },
    });
    console.log("Created browser QA user");
  }

  await prisma.tutorConversation.deleteMany({
    where: { userId: user.id, title: { startsWith: "Browser QA" } },
  });

  const reading = await prisma.reading.findFirst({
    where: { published: true, jlptLevel: "N5" },
    orderBy: { order: "asc" },
  });

  const conv = await prisma.tutorConversation.create({
    data: { userId: user.id, title: "Browser QA conversation" },
  });

  await prisma.tutorMessage.create({
    data: {
      conversationId: conv.id,
      role: "USER",
      content: "What should I study?",
    },
  });

  const recommendationResponse = {
    type: "RECOMMENDATION" as const,
    answer: "Try this reading to build comprehension.",
    recommendations: reading
      ? [
          {
            id: "browser-rec-1",
            type: "READING" as const,
            title: reading.title,
            reason: "Good next step for N5 reading practice",
            priority: "HIGH" as const,
            estimatedMinutes: 5,
            contentId: reading.slug,
          },
        ]
      : [],
    progressContext: {
      mode: "LEARNER_PROGRESS_SNAPSHOT",
      jlpt: { current: "N5", target: "N4", targetProgressPercent: 10 },
      weakSkills: [{ skill: "grammar", masteryPercent: 30 }],
      recentAccuracy: { value: 75, sampleSize: 10, trend: "up" as const },
      recentHighlights: [],
      dueReviews: { total: 3 },
    },
    outcomeContext: {
      mode: "OUTCOME_RESOLUTION" as const,
      confidence: "HIGH" as const,
      recommendation: {
        messageId: "seed-rec",
        contentId: reading?.slug ?? "seed-reading",
        occurredAt: new Date().toISOString(),
        activityType: "READING" as const,
        title: reading?.title ?? "Reading",
      },
      outcome: {
        type: "READING" as const,
        title: reading?.title ?? "Reading",
        contentId: reading?.slug ?? "seed-reading",
        scorePercent: 80,
        isCompleted: true,
        occurredAt: new Date().toISOString(),
      },
    },
    adaptiveCoachingContext: {
      mode: "ADAPTIVE_COACHING" as const,
      directive: "REINFORCE" as const,
      confidence: "HIGH" as const,
      recommendedBehavior: "internal only",
    },
  };

  const clientSafe = prepareTutorResponseForClient(recommendationResponse);

  await prisma.tutorMessage.create({
    data: {
      conversationId: conv.id,
      role: "ASSISTANT",
      content: recommendationResponse.answer,
      responseJson: recommendationResponse,
    },
  });

  await prisma.tutorMessage.create({
    data: {
      conversationId: conv.id,
      role: "ASSISTANT",
      content: "Let's practice a quick phrase.",
      responseJson: {
        type: "PRACTICE",
        answer: "Try translating this phrase.",
        practice: {
          phase: "QUESTION",
          difficulty: "EASY",
          question: "こんにちは",
          questionType: "FREE_RESPONSE",
          expectedAnswer: "Hello",
        },
      },
    },
  });

  console.log(
    JSON.stringify({
      email: BROWSER_EMAIL,
      conversationId: conv.id,
      readingSlug: reading?.slug ?? null,
      clientSafeKeys: Object.keys(clientSafe),
      hasExpectedAnswer: JSON.stringify(clientSafe).includes("expectedAnswer"),
    }),
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    const { prisma } = await import("../src/server/db");
    await prisma.$disconnect();
  });
