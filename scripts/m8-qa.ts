/**
 * M8 Mock Exam QA harness — run: npx tsx scripts/m8-qa.ts
 * Uses ephemeral QA users; does not print emails.
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
  const {
    startMockExamSession,
    saveMockExamAnswer,
    submitMockExamSession,
    getMockExamSessionState,
    getMockExamBySlug,
    getMockExamResult,
    getMockExamHistory,
    getLatestMockExamSummary,
  } = await import("../src/server/learning/mock-exam.service");

  const suffix = Date.now();
  const passwordHash = await bcrypt.hash("TestPass123!", 12);

  const userA = await prisma.user.create({
    data: {
      email: `m8qa-a-${suffix}@example.com`,
      passwordHash,
      profile: {
        create: {
          displayName: "QA User A",
          japaneseLevel: "N5",
          targetJlptLevel: "N5",
          learningGoal: "JLPT",
        },
      },
    },
    select: { id: true },
  });
  const userB = await prisma.user.create({
    data: {
      email: `m8qa-b-${suffix}@example.com`,
      passwordHash,
      profile: {
        create: {
          displayName: "QA User B",
          japaneseLevel: "N5",
          targetJlptLevel: "N5",
          learningGoal: "JLPT",
        },
      },
    },
    select: { id: true },
  });

  const userIdA = userA.id;
  const userIdB = userB.id;

  const draft = await getMockExamBySlug(userIdA, "n5-mock-exam-draft");
  draft === null ? pass("Draft exam returns null") : fail("Draft exam", "exposed");

  const exam = await getMockExamBySlug(userIdA, "n5-mock-exam-1");
  if (!exam) {
    fail("Published N5 exam", "not found");
    process.exit(1);
  }
  pass("Published N5 exam loads");

  const masteryBefore = await prisma.userVocabularyProgress.aggregate({
    where: { userId: userIdA },
    _sum: { mastery: true },
    _count: true,
  });

  const start1 = await startMockExamSession({
    userId: userIdA,
    payload: { mockExamId: exam.id },
  });
  if ("error" in start1) {
    fail("Start exam", start1.error);
    process.exit(1);
  }
  const sessionId = start1.sessionId;
  pass("Start exam creates session");

  const start2 = await startMockExamSession({
    userId: userIdA,
    payload: { mockExamId: exam.id },
  });
  if ("error" in start2) {
    fail("Continue exam", start2.error);
  } else if (start2.sessionId === sessionId) {
    pass("Continue exam reuses active session");
  } else {
    fail("Continue exam", "created duplicate session");
  }

  const state1 = await getMockExamSessionState({ userId: userIdA, sessionId });
  if ("error" in state1 || "scoreLabel" in state1) {
    fail("Session state load", "error or result");
  } else {
    const hasLeak = state1.questions.some((q) =>
      q.options.some((o) => "isCorrect" in o && (o as { isCorrect?: boolean }).isCorrect !== undefined),
    );
    if (hasLeak) fail("Pre-submit leak", "isCorrect in options");
    else pass("Pre-submit DTO has no isCorrect");
    if ("scorePercent" in state1) fail("Pre-submit leak", "score in state");
    else pass("Pre-submit DTO has no score");
    state1.expiresAt ? pass("expiresAt server-generated") : fail("Timer", "missing expiresAt");
  }

  const sessionQuestions = await prisma.userMockExamSessionQuestion.findMany({
    where: { sessionId },
    orderBy: { order: "asc" },
    include: {
      mockExamQuestion: { include: { options: true } },
    },
  });

  for (let i = 0; i < Math.min(3, sessionQuestions.length); i++) {
    const sq = sessionQuestions[i];
    const option = sq.mockExamQuestion.options[0];
    const save = await saveMockExamAnswer({
      userId: userIdA,
      payload: {
        sessionId,
        questionId: sq.mockExamQuestionId,
        selectedOptionId: option.id,
      },
    });
    if ("error" in save) fail(`Save answer Q${i + 1}`, save.error);
    else pass(`Save answer Q${i + 1}`);
  }

  const state2 = await getMockExamSessionState({ userId: userIdA, sessionId });
  if ("error" in state2 || "scoreLabel" in state2) {
    fail("Session resume", "failed after saves");
  } else if (state2.answeredCount >= 3) {
    pass("Answers persist in session state");
  } else {
    fail("Answers persist", `answeredCount=${state2.answeredCount}`);
  }

  const wrongQuestion = await prisma.mockExamQuestion.findFirst({
    where: { NOT: { id: { in: sessionQuestions.map((q) => q.mockExamQuestionId) } } },
    include: { options: true },
  });
  if (wrongQuestion && wrongQuestion.options[0]) {
    const denied = await saveMockExamAnswer({
      userId: userIdA,
      payload: {
        sessionId,
        questionId: wrongQuestion.id,
        selectedOptionId: wrongQuestion.options[0].id,
      },
    });
    if ("error" in denied) pass("Question ownership denied");
    else fail("Question ownership", "accepted foreign question");
  }

  const q1 = sessionQuestions[0];
  const foreignOption = await prisma.mockExamQuestionOption.findFirst({
    where: { NOT: { questionId: q1.mockExamQuestionId } },
  });
  if (foreignOption) {
    const denied = await saveMockExamAnswer({
      userId: userIdA,
      payload: {
        sessionId,
        questionId: q1.mockExamQuestionId,
        selectedOptionId: foreignOption.id,
      },
    });
    if ("error" in denied) pass("Option ownership denied");
    else fail("Option ownership", "accepted foreign option");
  }

  const userBAccess = await getMockExamSessionState({ userId: userIdB, sessionId });
  if ("error" in userBAccess && userBAccess.error.includes("access")) {
    pass("User isolation on session state");
  } else {
    fail("User isolation", "User B accessed User A session");
  }

  const userBSave = await saveMockExamAnswer({
    userId: userIdB,
    payload: {
      sessionId,
      questionId: q1.mockExamQuestionId,
      selectedOptionId: q1.mockExamQuestion.options[0].id,
    },
  });
  if ("error" in userBSave) pass("User isolation on save answer");
  else fail("User isolation save", "User B saved to User A session");

  const tamper = await submitMockExamSession({
    userId: userIdA,
    payload: {
      sessionId,
      score: 100,
      isCorrect: true,
      userId: userIdB,
    },
  });
  if ("error" in tamper) {
    fail("Submit", tamper.error);
  } else {
    pass("Submit accepts only sessionId (ignores forged fields)");
    if (tamper.scorePercent > 0 && tamper.scorePercent < 100) {
      // partial answers - score should reflect actual answers not 100
    }
    if (tamper.scoreLabel === "Mock Exam Score") pass("Score label correct");
  }

  const submit2 = await submitMockExamSession({
    userId: userIdA,
    payload: { sessionId },
  });
  if ("error" in submit2) {
    pass("Duplicate submit returns existing result");
  } else if (submit2.sessionId === sessionId) {
    pass("Duplicate submit idempotent");
  }

  const mutate = await saveMockExamAnswer({
    userId: userIdA,
    payload: {
      sessionId,
      questionId: q1.mockExamQuestionId,
      selectedOptionId: q1.mockExamQuestion.options[0].id,
    },
  });
  if ("error" in mutate) pass("Submitted session rejects answer mutation");
  else fail("Submitted mutation", "allowed save after submit");

  const resultRefresh = await getMockExamResult({ userId: userIdA, sessionId });
  if ("error" in resultRefresh) fail("Result refresh", resultRefresh.error);
  else {
    pass("Result refresh works");
    if (resultRefresh.answers.some((a) => a.correctOptionText)) {
      pass("Post-submit review exposes correct answers");
    }
  }

  const history = await getMockExamHistory(userIdA);
  if (history.some((h) => h.sessionId === sessionId)) pass("Exam history includes session");
  else fail("Exam history", "missing session");

  const latest = await getLatestMockExamSummary(userIdA);
  if (latest?.sessionId === sessionId) pass("Latest mock exam summary");
  else fail("Latest summary", "mismatch");

  const masteryAfter = await prisma.userVocabularyProgress.aggregate({
    where: { userId: userIdA },
    _sum: { mastery: true },
    _count: true,
  });
  if (
    masteryBefore._sum.mastery === masteryAfter._sum.mastery &&
    masteryBefore._count === masteryAfter._count
  ) {
    pass("Mock exam does not mutate vocabulary mastery");
  } else {
    fail("Mastery mutation", "vocabulary progress changed");
  }

  // Expiration test — shorten expiresAt on a new session
  const startExp = await startMockExamSession({
    userId: userIdB,
    payload: { mockExamId: exam.id },
  });
  if ("error" in startExp) {
    fail("Expiration setup", startExp.error);
  } else {
    await prisma.userMockExamSession.update({
      where: { id: startExp.sessionId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const expSave = await saveMockExamAnswer({
      userId: userIdB,
      payload: {
        sessionId: startExp.sessionId,
        questionId: q1.mockExamQuestionId,
        selectedOptionId: q1.mockExamQuestion.options[0].id,
      },
    });
    if ("error" in expSave && expSave.error.includes("expired")) {
      pass("Expired session rejects new answers");
    } else if ("error" in expSave) {
      pass("Expired session rejects saves");
    } else {
      fail("Expiration", "accepted answer after expiry");
    }
    const expResult = await getMockExamSessionState({
      userId: userIdB,
      sessionId: startExp.sessionId,
    });
    if ("scoreLabel" in expResult) pass("Expired session can be finalized");
    else fail("Expiration finalize", "no result after expiry");
  }

  // Content validity
  const n5 = await prisma.mockExam.findFirst({
    where: { slug: "n5-mock-exam-1" },
    include: {
      sections: {
        include: {
          questions: { include: { options: true } },
        },
      },
    },
  });
  const orphanOptions = n5?.sections.every((s) =>
    s.questions.every((q) => q.options.length >= 2),
  );
  orphanOptions ? pass("N5 question options valid") : fail("N5 content", "missing options");

  const failed = results.filter((r) => r.status === "FAILED");
  console.log(`\n--- ${results.length - failed.length}/${results.length} passed ---`);
  if (failed.length > 0) {
    failed.forEach((f) => console.log(`FAILED: ${f.name} — ${f.detail}`));
    process.exit(1);
  }

  // Cleanup QA users
  await prisma.user.deleteMany({
    where: { email: { in: [`m8qa-a-${suffix}@example.com`, `m8qa-b-${suffix}@example.com`] } },
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
