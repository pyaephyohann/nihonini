/**
 * M9.7.3 Step 1 Adaptive Dashboard Foundation QA — run: npx tsx scripts/m9-7-3-step-1-qa.ts
 */
import { spawnSync } from "node:child_process";
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

function isInternalHref(href: string): boolean {
  return href.startsWith("/app/") && !href.includes("://");
}

function runRegressionScript(script: string): boolean {
  const result = spawnSync("npx", ["tsx", script], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status === 0) {
    pass(`Regression ${script}`);
    return true;
  }
  fail(
    `Regression ${script}`,
    result.stderr?.slice(-500) || result.stdout?.slice(-500) || `exit ${result.status}`,
  );
  return false;
}

async function main() {
  const { resolveDashboardNextAction, buildContinueLearningHref } = await import(
    "../src/lib/dashboard/dashboard-view-model"
  );
  const { buildPracticeSessionHref } = await import("../src/lib/learning/learning-links");

  const reviewResolved = resolveDashboardNextAction({
    learnerLevel: "N5",
    dueReviews: { vocabulary: 3, grammar: 0, kanji: 0, total: 3 },
    weaknesses: [],
    continueLearning: { lessonTitle: null, lessonSlug: null, progressPercent: 0 },
  });
  reviewResolved.source === "REVIEW" &&
  reviewResolved.href.includes("mode=REVIEW") &&
  reviewResolved.skill === "VOCABULARY"
    ? pass("Unit — Due-review resolves to REVIEW session")
    : fail("Unit — Due-review", JSON.stringify(reviewResolved));

  const weaknessResolved = resolveDashboardNextAction({
    learnerLevel: "N5",
    dueReviews: { vocabulary: 0, grammar: 0, kanji: 0, total: 0 },
    weaknesses: [
      { skill: "GRAMMAR", level: "N5", masteryPercent: 35, itemsStarted: 5 },
    ],
    continueLearning: { lessonTitle: null, lessonSlug: null, progressPercent: 0 },
  });
  weaknessResolved.source === "WEAKNESS" &&
  weaknessResolved.href ===
    buildPracticeSessionHref({
      level: "N5",
      skill: "GRAMMAR",
      mode: "WEAKNESS",
      count: 10,
    })
    ? pass("Unit — Weakness resolves to WEAKNESS session")
    : fail("Unit — Weakness", JSON.stringify(weaknessResolved));

  const continueResolved = resolveDashboardNextAction({
    learnerLevel: "N5",
    dueReviews: { vocabulary: 0, grammar: 0, kanji: 0, total: 0 },
    weaknesses: [],
    continueLearning: {
      lessonTitle: "Intro",
      lessonSlug: "intro-lesson",
      progressPercent: 40,
    },
  });
  continueResolved.source === "CONTINUE" &&
  continueResolved.href === buildContinueLearningHref({
    lessonTitle: "Intro",
    lessonSlug: "intro-lesson",
    progressPercent: 40,
  })
    ? pass("Unit — Continue learning resolves to lesson href")
    : fail("Unit — Continue", JSON.stringify(continueResolved));

  const fallbackResolved = resolveDashboardNextAction({
    learnerLevel: "N5",
    dueReviews: { vocabulary: 0, grammar: 0, kanji: 0, total: 0 },
    weaknesses: [],
    continueLearning: { lessonTitle: null, lessonSlug: null, progressPercent: 0 },
  });
  fallbackResolved.source === "FALLBACK" && fallbackResolved.href === "/app/learn"
    ? pass("Unit — Fallback resolves to /app/learn")
    : fail("Unit — Fallback", JSON.stringify(fallbackResolved));

  !reviewResolved.href.includes("undefined") && !reviewResolved.href.includes("null")
    ? pass("Unit — No undefined/null query parameters")
    : fail("Unit — Query params", reviewResolved.href);

  reviewResolved.context.includes("ready for review") &&
  weaknessResolved.context.includes("weakest") &&
  continueResolved.context.includes("Greetings") &&
  fallbackResolved.context.includes("foundation")
    ? pass("Unit — All states include context copy")
    : fail("Unit — Context copy", "missing expected context");

  const bcrypt = await import("bcrypt");
  const { prisma } = await import("../src/server/db");
  const { buildDashboardViewModel } = await import(
    "../src/server/dashboard/dashboard-view-model.service"
  );
  const { getDashboardSnapshot } = await import(
    "../src/server/learning/daily-learning.service"
  );

  let dbAvailable = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbAvailable = false;
    fail(
      "Database connectivity",
      "PostgreSQL unavailable at DATABASE_URL — integration tests skipped",
    );
  }

  if (!dbAvailable) {
    const passed = results.filter((r) => r.status === "PASSED").length;
    const failed = results.filter((r) => r.status === "FAILED").length;
    console.log(`\n--- M9.7.3 Step 1 QA: ${passed}/${results.length} passed ---`);
    process.exit(failed > 0 ? 1 : 0);
  }

  const suffix = Date.now();
  const passwordHash = await bcrypt.hash("TestPass123!", 12);

  const emptyUser = await prisma.user.create({
    data: {
      email: `m973s1-empty-${suffix}@example.com`,
      passwordHash,
      profile: {
        create: {
          displayName: "M973 Empty",
          japaneseLevel: "N5",
          targetJlptLevel: "N5",
          learningGoal: "JLPT",
          dailyGoal: 10,
        },
      },
    },
    select: { id: true },
  });

  const emptyModel = await buildDashboardViewModel(emptyUser.id);
  emptyModel.nextAction.href && isInternalHref(emptyModel.nextAction.href)
    ? pass("Test 1 — Dashboard view model created for authenticated user")
    : fail("Test 1 — View model", emptyModel.nextAction.href);

  emptyModel.snapshot.learnerGoal.currentLevel === "N5"
    ? pass("Test 1 — Snapshot includes learner level")
    : fail("Test 1 — Learner level", emptyModel.snapshot.learnerGoal.currentLevel);

  const reviewUser = await prisma.user.create({
    data: {
      email: `m973s1-review-${suffix}@example.com`,
      passwordHash,
      profile: {
        create: {
          displayName: "M973 Review",
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

  let reviewModel: Awaited<ReturnType<typeof buildDashboardViewModel>> | null = null;

  if (!vocab) {
    fail("Seed vocabulary", "no N5 vocabulary in database");
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

    reviewModel = await buildDashboardViewModel(reviewUser.id);
    reviewModel.nextAction.source === "REVIEW"
      ? pass("Test 2 — Due-review signal selects REVIEW action")
      : fail("Test 2 — REVIEW source", reviewModel.nextAction.source);

    reviewModel.nextAction.href.includes("mode=REVIEW")
      ? pass("Test 2 — Review href uses REVIEW mode")
      : fail("Test 2 — Review href", reviewModel.nextAction.href);

    reviewModel.nextAction.skill === "VOCABULARY"
      ? pass("Test 2 — Primary review skill consumed")
      : fail("Test 2 — Review skill", String(reviewModel.nextAction.skill));
  }

  emptyModel.nextAction.source === "FALLBACK" || emptyModel.nextAction.source === "CONTINUE"
    ? pass("Test 3 — No-due-review state has safe action")
    : fail("Test 3 — Empty user action", emptyModel.nextAction.source);

  !emptyModel.nextAction.href.includes("undefined") &&
  !emptyModel.nextAction.href.includes("null")
    ? pass("Test 3 — No undefined/null in empty-state href")
    : fail("Test 3 — Malformed href", emptyModel.nextAction.href);

  const resolvedWeakness = weaknessResolved;
  resolvedWeakness.source === "WEAKNESS"
    ? pass("Test 4 — Weakness signal consumed when available")
    : fail("Test 4 — Weakness", `${resolvedWeakness.source} ${resolvedWeakness.href}`);

  emptyModel.nextAction.source === "FALLBACK" ||
  emptyModel.nextAction.source === "CONTINUE"
    ? pass("Test 5 — Fallback action is valid")
    : fail("Test 5 — Fallback source", emptyModel.nextAction.source);

  isInternalHref(emptyModel.nextAction.href)
    ? pass("Test 6 — Action href is internal canonical URL")
    : fail("Test 6 — External or invalid href", emptyModel.nextAction.href);

  emptyModel.nextAction.href.startsWith("/app/")
    ? pass("Test 7 — Practice/review links stay under /app")
    : fail("Test 7 — App path prefix", emptyModel.nextAction.href);

  const reviewResolvedIntegration = reviewModel?.nextAction ?? reviewResolved;
  !reviewResolvedIntegration.href.includes("undefined") &&
  !reviewResolvedIntegration.href.includes("null")
    ? pass("Test 8 — No undefined/null query parameters")
    : fail("Test 8 — Query params", reviewResolvedIntegration.href);

  const otherUser = await prisma.user.create({
    data: {
      email: `m973s1-other-${suffix}@example.com`,
      passwordHash,
      profile: {
        create: {
          displayName: "M973 Other",
          japaneseLevel: "N4",
          targetJlptLevel: "N4",
          learningGoal: "JLPT",
          dailyGoal: 10,
        },
      },
    },
    select: { id: true },
  });

  const emptySnapshot = await getDashboardSnapshot(emptyUser.id);
  const otherSnapshot = await getDashboardSnapshot(otherUser.id);
  emptySnapshot.learnerGoal.currentLevel === "N5" &&
  otherSnapshot.learnerGoal.currentLevel === "N4"
    ? pass("Test 9 — Learner ownership preserved in snapshot")
    : fail("Test 9 — Ownership", "level mismatch");

  const progressCountsBefore = await prisma.userVocabularyProgress.count({
    where: { userId: reviewUser.id },
  });
  await buildDashboardViewModel(reviewUser.id);
  await buildDashboardViewModel(reviewUser.id);
  const progressCountsAfter = await prisma.userVocabularyProgress.count({
    where: { userId: reviewUser.id },
  });
  progressCountsBefore === progressCountsAfter
    ? pass("Test 10 — No database mutation during view-model build")
    : fail("Test 10 — DB mutation", `${progressCountsBefore} -> ${progressCountsAfter}`);

  emptyModel.snapshot.dailyProgress.target >= 1 &&
  typeof emptyModel.snapshot.streakDays === "number"
    ? pass("Test 11 — Existing dashboard snapshot fields intact")
    : fail("Test 11 — Snapshot fields", JSON.stringify(emptyModel.snapshot));

  runRegressionScript("scripts/m9-7-1-qa.ts");
  runRegressionScript("scripts/m9-7-2-qa.ts");
  runRegressionScript("scripts/m9-6-5-qa.ts");

  const passed = results.filter((r) => r.status === "PASSED").length;
  const failed = results.filter((r) => r.status === "FAILED").length;
  console.log(`\n--- M9.7.3 Step 1 QA: ${passed}/${results.length} passed ---`);
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
