/**
 * M9.7.1 Review Hub QA — run: npx tsx scripts/m9-7-1-qa.ts
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
  const bcrypt = await import("bcrypt");
  const { prisma } = await import("../src/server/db");
  const { getDueReviewSummary, getDueReviews } = await import(
    "../src/server/learning/daily-learning.service"
  );
  const { getPracticeDefaults } = await import(
    "../src/server/learning/practice-session.service"
  );
  const { createPracticeSessionPlan } = await import(
    "../src/server/learning/practice-session.service"
  );
  const {
    buildReviewSessionHref,
    pickPrimaryReviewSkill,
  } = await import("../src/lib/learning/review-session");

  // URL contract
  const href = buildReviewSessionHref({
    level: "N5",
    skill: "VOCABULARY",
    count: 10,
  });
  href === "/app/practice/session?level=N5&skill=VOCABULARY&mode=REVIEW&count=10"
    ? pass("Review session URL contract")
    : fail("Review session URL contract", href);

  const primary = pickPrimaryReviewSkill({
    vocabulary: 2,
    grammar: 8,
    kanji: 0,
    total: 10,
  });
  primary === "GRAMMAR" ? pass("Primary skill picks highest due count") : fail("Primary skill", String(primary));

  pickPrimaryReviewSkill({ vocabulary: 0, grammar: 0, kanji: 0, total: 0 }) === null
    ? pass("Primary skill null when empty")
    : fail("Primary skill empty", "expected null");

  const suffix = Date.now();
  const passwordHash = await bcrypt.hash("TestPass123!", 12);
  const user = await prisma.user.create({
    data: {
      email: `m971qa-${suffix}@example.com`,
      passwordHash,
      profile: {
        create: {
          displayName: "M971 QA",
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
    fail("Seed vocabulary", "no N5 vocabulary in database");
  } else {
    const past = new Date(Date.now() - 60_000);
    await prisma.userVocabularyProgress.create({
      data: {
        userId: user.id,
        vocabularyId: vocab.id,
        mastery: 0.4,
        attemptCount: 2,
        correctCount: 1,
        incorrectCount: 1,
        nextReviewAt: past,
      },
    });

    const summary = await getDueReviewSummary(user.id);
    summary.total >= 1 && summary.vocabulary >= 1
      ? pass("Due review summary reflects seeded item")
      : fail("Due review summary", JSON.stringify(summary));

    const dueItems = await getDueReviews(user.id);
    dueItems.vocabulary.length >= 1
      ? pass("getDueReviews returns vocabulary rows")
      : fail("getDueReviews", String(dueItems.vocabulary.length));

    summary.total === summary.vocabulary + summary.grammar + summary.kanji
      ? pass("Summary total equals skill sum")
      : fail("Summary total", JSON.stringify(summary));

    const defaults = await getPracticeDefaults(user.id);
    const skill = pickPrimaryReviewSkill(summary);
    const sessionHref = buildReviewSessionHref({
      level: defaults.level,
      skill: skill!,
      count: 10,
    });

    const params = new URL(sessionHref, "http://localhost").searchParams;
    params.get("mode") === "REVIEW" ? pass("Href uses REVIEW mode") : fail("mode", params.get("mode") ?? "null");

    const plan = await createPracticeSessionPlan({
      userId: user.id,
      config: {
        level: defaults.level,
        skill: skill!,
        mode: "REVIEW",
        questionCount: 10,
      },
    });

    if ("error" in plan) {
      fail("REVIEW session plan", plan.error);
    } else {
      plan.mode === "REVIEW" && plan.exercises.length >= 1
        ? pass("REVIEW session plan returns exercises for due item")
        : fail("REVIEW session plan", JSON.stringify({ mode: plan.mode, count: plan.exercises.length }));
    }
  }

  const emptyUser = await prisma.user.create({
    data: {
      email: `m971qa-empty-${suffix}@example.com`,
      passwordHash,
      profile: {
        create: {
          displayName: "M971 Empty",
          japaneseLevel: "N5",
          targetJlptLevel: "N5",
          learningGoal: "JLPT",
          dailyGoal: 10,
        },
      },
    },
    select: { id: true },
  });

  const emptySummary = await getDueReviewSummary(emptyUser.id);
  emptySummary.total === 0
    ? pass("Empty user has zero due reviews")
    : fail("Empty user due count", String(emptySummary.total));

  const passed = results.filter((r) => r.status === "PASSED").length;
  const failed = results.filter((r) => r.status === "FAILED").length;
  console.log(`\n--- M9.7.1 QA: ${passed}/${results.length} passed ---`);
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
