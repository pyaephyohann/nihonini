/**
 * M9.7.3 Step 3 Adaptive Dashboard Context QA — run: npx tsx scripts/m9-7-3-step-3-qa.ts
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

type Result = { name: string; status: "PASSED" | "FAILED"; detail?: string };
const results: Result[] = [];

function pass(name: string) {
  results.push({ name, status: "PASSED" });
  console.log(`✓ ${name}`);
}

function fail(name: string, detail: string) {
  results.push({ name, status: "FAILED", detail });
  console.log(`✗ ${name}: ${detail}`);
}

async function main() {
  const { resolveDashboardNextAction } = await import(
    "../src/lib/dashboard/dashboard-view-model"
  );
  const { buildPracticeSessionHref } = await import("../src/lib/learning/learning-links");

  // State A — REVIEW
  const review = resolveDashboardNextAction({
    learnerLevel: "N5",
    dueReviews: { vocabulary: 5, grammar: 3, kanji: 0, total: 8 },
    weaknesses: [
      { skill: "GRAMMAR", level: "N5", masteryPercent: 20, itemsStarted: 5 },
    ],
    continueLearning: {
      lessonTitle: "Greetings",
      lessonSlug: "n5-greetings",
      progressPercent: 10,
    },
  });
  review.source === "REVIEW" &&
  review.href.includes("mode=REVIEW") &&
  review.context.includes("8 items")
    ? pass("State A — REVIEW precedence over weakness and continue")
    : fail("State A — REVIEW source/href", JSON.stringify(review));
  review.context.includes("8 items ready for review")
    ? pass("State A — REVIEW context explains due count")
    : fail("State A — REVIEW context", review.context);

  // State B — WEAKNESS
  const weakness = resolveDashboardNextAction({
    learnerLevel: "N5",
    dueReviews: { vocabulary: 0, grammar: 0, kanji: 0, total: 0 },
    weaknesses: [
      { skill: "GRAMMAR", level: "N5", masteryPercent: 35, itemsStarted: 5 },
    ],
    continueLearning: {
      lessonTitle: "Greetings",
      lessonSlug: "n5-greetings",
      progressPercent: 0,
    },
  });
  weakness.source === "WEAKNESS" &&
  weakness.href ===
    buildPracticeSessionHref({
      level: "N5",
      skill: "GRAMMAR",
      mode: "WEAKNESS",
      count: 10,
    })
    ? pass("State B — WEAKNESS href")
    : fail("State B — WEAKNESS href", weakness.href);
  weakness.context.toLowerCase().includes("grammar") &&
  weakness.context.toLowerCase().includes("weakest")
    ? pass("State B — WEAKNESS context")
    : fail("State B — WEAKNESS context", weakness.context);

  // State C — CONTINUE
  const cont = resolveDashboardNextAction({
    learnerLevel: "N5",
    dueReviews: { vocabulary: 0, grammar: 0, kanji: 0, total: 0 },
    weaknesses: [],
    continueLearning: {
      lessonTitle: "Greetings",
      lessonSlug: "n5-greetings",
      progressPercent: 25,
    },
  });
  cont.source === "CONTINUE" &&
  cont.href === "/app/learn/n5-greetings" &&
  cont.context.includes("Greetings")
    ? pass("State C — CONTINUE context and href")
    : fail("State C — CONTINUE", JSON.stringify(cont));

  // State D — FALLBACK
  const fallback = resolveDashboardNextAction({
    learnerLevel: "N5",
    dueReviews: { vocabulary: 0, grammar: 0, kanji: 0, total: 0 },
    weaknesses: [],
    continueLearning: { lessonTitle: null, lessonSlug: null, progressPercent: 0 },
  });
  fallback.source === "FALLBACK" &&
  fallback.href === "/app/learn" &&
  fallback.context.includes("foundation")
    ? pass("State D — FALLBACK context and href")
    : fail("State D — FALLBACK", JSON.stringify(fallback));

  // Precedence: due reviews beat weakness
  review.source === "REVIEW"
    ? pass("Precedence — REVIEW before WEAKNESS unchanged")
    : fail("Precedence", review.source);

  // Context always present
  [review, weakness, cont, fallback].every((action) => action.context.trim().length > 0)
    ? pass("All states include non-empty context")
    : fail("Context presence", "missing context on an action");

  const bcrypt = await import("bcrypt");
  const { prisma } = await import("../src/server/db");
  const { buildDashboardViewModel } = await import(
    "../src/server/dashboard/dashboard-view-model.service"
  );

  let dbAvailable = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbAvailable = false;
    fail("Database connectivity", "PostgreSQL unavailable — integration skipped");
  }

  if (dbAvailable) {
    const suffix = Date.now();
    const passwordHash = await bcrypt.hash("TestPass123!", 12);

    const reviewUser = await prisma.user.create({
      data: {
        email: `m973s3-review-${suffix}@example.com`,
        passwordHash,
        profile: {
          create: {
            displayName: "M973S3 Review",
            japaneseLevel: "N5",
            targetJlptLevel: "N5",
            learningGoal: "JLPT",
            dailyGoal: 10,
          },
        },
      },
      select: { id: true },
    });

    const vocab = await prisma.vocabulary.findFirst({
      where: { jlptLevel: "N5" },
      select: { id: true },
    });

    if (!vocab) {
      fail("Seed vocabulary", "no N5 vocabulary");
    } else {
      await prisma.userVocabularyProgress.create({
        data: {
          userId: reviewUser.id,
          vocabularyId: vocab.id,
          mastery: 0.4,
          attemptCount: 2,
          correctCount: 1,
          incorrectCount: 1,
          nextReviewAt: new Date(Date.now() - 60_000),
        },
      });

      const reviewModel = await buildDashboardViewModel(reviewUser.id);
      reviewModel.nextAction.source === "REVIEW" &&
      reviewModel.nextAction.context.includes("ready for review")
        ? pass("Integration — REVIEW state includes context")
        : fail("Integration — REVIEW", JSON.stringify(reviewModel.nextAction));
    }
  }

  const passed = results.filter((r) => r.status === "PASSED").length;
  const failed = results.filter((r) => r.status === "FAILED").length;
  console.log(`\n--- M9.7.3 Step 3 QA: ${passed}/${results.length} passed ---`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/server/db");
    await prisma.$disconnect();
  });
