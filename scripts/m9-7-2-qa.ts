/**
 * M9.7.2 Canonical Learning Deep Links QA — run: npx tsx scripts/m9-7-2-qa.ts
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
  const {
    buildLearningActionHref,
    buildPracticeSessionHref,
    sanitizeContentSlug,
  } = await import("../src/lib/learning/learning-links");
  const { buildReviewSessionHref } = await import("../src/lib/learning/review-session");
  const { getRecommendationHref, getSuggestedActionHref } = await import(
    "../src/lib/tutor/suggested-actions"
  );

  // Test 1 — Review link
  const reviewHref = buildPracticeSessionHref({
    level: "N5",
    skill: "GRAMMAR",
    mode: "REVIEW",
    count: 10,
  });
  reviewHref === "/app/practice/session?level=N5&skill=GRAMMAR&mode=REVIEW&count=10"
    ? pass("Test 1 — Review deep link")
    : fail("Test 1 — Review deep link", reviewHref);

  // Test 2 — Weakness link
  const weaknessHref = buildPracticeSessionHref({
    level: "N4",
    skill: "VOCABULARY",
    mode: "WEAKNESS",
    count: 10,
  });
  weaknessHref === "/app/practice/session?level=N4&skill=VOCABULARY&mode=WEAKNESS&count=10"
    ? pass("Test 2 — Weakness deep link")
    : fail("Test 2 — Weakness deep link", weaknessHref);

  getSuggestedActionHref("PRACTICE_WEAK_GRAMMAR", { level: "N5" }) ===
  "/app/practice/session?level=N5&skill=GRAMMAR&mode=WEAKNESS&count=10"
    ? pass("Test 2 — Tutor weakness action uses canonical builder")
    : fail(
        "Test 2 — Tutor weakness action",
        getSuggestedActionHref("PRACTICE_WEAK_GRAMMAR", { level: "N5" }) ?? "null",
      );

  // Test 3 — Level practice link
  const levelHref = buildPracticeSessionHref({
    level: "N5",
    skill: "KANJI",
    mode: "LEVEL",
    count: 10,
  });
  levelHref === "/app/practice/session?level=N5&skill=KANJI&mode=LEVEL&count=10"
    ? pass("Test 3 — Level practice deep link")
    : fail("Test 3 — Level practice deep link", levelHref);

  getSuggestedActionHref("OPEN_KANJI", { level: "N5" }) === levelHref
    ? pass("Test 3 — OPEN_KANJI suggested action")
    : fail("Test 3 — OPEN_KANJI", getSuggestedActionHref("OPEN_KANJI", { level: "N5" }) ?? "null");

  // Test 4 — Specific content link
  getRecommendationHref("LESSON", "intro-lesson") === "/app/learn/intro-lesson"
    ? pass("Test 4 — Lesson content slug preserved")
    : fail("Test 4 — Lesson", getRecommendationHref("LESSON", "intro-lesson") ?? "null");

  getRecommendationHref("READING", "n5-story") === "/app/learn/reading/n5-story"
    ? pass("Test 4 — Reading content slug preserved")
    : fail("Test 4 — Reading", getRecommendationHref("READING", "n5-story") ?? "null");

  getRecommendationHref("LISTENING", "n5-dialogue") === "/app/learn/listening/n5-dialogue"
    ? pass("Test 4 — Listening content slug preserved")
    : fail("Test 4 — Listening", getRecommendationHref("LISTENING", "n5-dialogue") ?? "null");

  // Test 5 — Undefined parameters omitted (no level → catalog fallback)
  getSuggestedActionHref("OPEN_PRACTICE") === "/app/practice"
    ? pass("Test 5 — Missing level falls back to practice setup")
    : fail("Test 5 — OPEN_PRACTICE fallback", getSuggestedActionHref("OPEN_PRACTICE") ?? "null");

  getRecommendationHref("REVIEW", undefined, { level: "N5" }) === "/app/review"
    ? pass("Test 5 — REVIEW without skill routes to review hub")
    : fail(
        "Test 5 — REVIEW hub fallback",
        getRecommendationHref("REVIEW", undefined, { level: "N5" }) ?? "null",
      );

  const hrefWithDefaults = buildPracticeSessionHref({
    level: "N5",
    skill: "GRAMMAR",
    mode: "REVIEW",
  });
  !hrefWithDefaults.includes("undefined") && !hrefWithDefaults.includes("null")
    ? pass("Test 5 — No undefined/null serialized in practice href")
    : fail("Test 5 — undefined/null in URL", hrefWithDefaults);

  // Test 6 — URL encoding / unsafe slug rejection
  sanitizeContentSlug("../../../etc/passwd") === null
    ? pass("Test 6 — Unsafe slug rejected")
    : fail("Test 6 — Unsafe slug", "accepted");

  getRecommendationHref("LESSON", "../../../etc/passwd") === null
    ? pass("Test 6 — Unsafe contentId rejected in recommendation href")
    : fail("Test 6 — Unsafe contentId", "accepted");

  const encodedLesson = buildLearningActionHref({ type: "LESSON", slug: "my-lesson" });
  encodedLesson === `/app/learn/${encodeURIComponent("my-lesson")}`
    ? pass("Test 6 — Content slug encoded in path")
    : fail("Test 6 — Encoding", encodedLesson ?? "null");

  // Test 7 — Tutor recommendation integration
  const tutorReviewHref = getRecommendationHref("REVIEW", undefined, {
    level: "N5",
    targetSkill: "GRAMMAR",
    count: 10,
  });
  tutorReviewHref === "/app/practice/session?level=N5&skill=GRAMMAR&mode=REVIEW&count=10"
    ? pass("Test 7 — Tutor REVIEW recommendation preserves intent")
    : fail("Test 7 — Tutor REVIEW", tutorReviewHref ?? "null");

  const tutorPracticeHref = getRecommendationHref("PRACTICE", undefined, {
    level: "N5",
    targetSkill: "GRAMMAR",
  });
  tutorPracticeHref === "/app/practice/session?level=N5&skill=GRAMMAR&mode=WEAKNESS&count=10"
    ? pass("Test 7 — Tutor PRACTICE recommendation preserves weakness intent")
    : fail("Test 7 — Tutor PRACTICE", tutorPracticeHref ?? "null");

  getSuggestedActionHref("OPEN_MOCK_EXAM") === "/app/exams"
    ? pass("Test 7 — Backward-compatible catalog routes")
    : fail("Test 7 — OPEN_MOCK_EXAM", getSuggestedActionHref("OPEN_MOCK_EXAM") ?? "null");

  // Test 8 — Review Hub regression
  const reviewHubHref = buildReviewSessionHref({
    level: "N5",
    skill: "VOCABULARY",
    count: 10,
  });
  reviewHubHref === "/app/practice/session?level=N5&skill=VOCABULARY&mode=REVIEW&count=10"
    ? pass("Test 8 — Review Hub session href unchanged")
    : fail("Test 8 — Review Hub", reviewHubHref);

  // Test 9 — Progress regression pattern
  const progressHref = buildPracticeSessionHref({
    level: "N3",
    skill: "GRAMMAR",
    mode: "WEAKNESS",
    count: 10,
  });
  progressHref === "/app/practice/session?level=N3&skill=GRAMMAR&mode=WEAKNESS&count=10"
    ? pass("Test 9 — Progress weakness practice href")
    : fail("Test 9 — Progress href", progressHref);

  // Test 10 — M9 regression suite
  const regressionScripts = [
    "scripts/m9-qa.ts",
    "scripts/m9-2-qa.ts",
    "scripts/m9-3-qa.ts",
    "scripts/m9-4-qa.ts",
    "scripts/m9-5-qa.ts",
    "scripts/m9-6-qa.ts",
    "scripts/m9-6-5-qa.ts",
    "scripts/m9-7-1-qa.ts",
  ];

  for (const script of regressionScripts) {
    runRegressionScript(script);
  }

  const passed = results.filter((r) => r.status === "PASSED").length;
  const failed = results.filter((r) => r.status === "FAILED").length;
  console.log(`\n--- M9.7.2 QA: ${passed}/${results.length} passed ---`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
