/**
 * Verify browser learning loop coaching path for m965browser user.
 * Run after completing reading in browser: npx tsx scripts/m9-6-5-browser-loop-verify.ts
 */
import Module from "node:module";
import { config } from "dotenv";
import type { TutorOutcomeContext } from "../src/server/tutor/outcome/tutor-outcome.types";
import type { TutorAdaptiveCoachingContext } from "../src/server/tutor/coaching/tutor-coaching.types";

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
  process.env.TUTOR_ENABLED = "true";

  const { prisma } = await import("../src/server/db");
  const { sendTutorMessage } = await import("../src/server/tutor/tutor.service");
  const { determineCoachingPolicy } = await import(
    "../src/server/tutor/coaching/tutor-coaching-policy"
  );
  const { setTutorAiProviderForTests } = await import(
    "../src/server/tutor/ai/openai-compatible.provider"
  );
  type TutorAiProvider = import("../src/server/tutor/ai/provider").TutorAiProvider;

  const user = await prisma.user.findUnique({
    where: { email: BROWSER_EMAIL },
    select: { id: true },
  });
  if (!user) {
    throw new Error("Browser QA user not found");
  }

  const conv = await prisma.tutorConversation.findFirst({
    where: { userId: user.id, title: "Browser QA conversation" },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (!conv) {
    throw new Error("Browser QA conversation not found");
  }

  const submission = await prisma.readingSubmission.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      scorePercent: true,
      correctCount: true,
      totalCount: true,
      createdAt: true,
      reading: { select: { slug: true, title: true } },
    },
  });

  console.log("Authoritative submission:", submission);

  const mockProvider: TutorAiProvider = {
    async complete() {
      return {
        text: JSON.stringify({
          type: "EXPLANATION",
          answer:
            "Great work — you scored 100% on that reading. Keep reinforcing your comprehension.",
        }),
        model: "mock-browser-loop",
      };
    },
  };
  setTutorAiProviderForTests(mockProvider);

  const result = await sendTutorMessage({
    userId: user.id,
    payload: { conversationId: conv.id, message: "How did I do on that reading?" },
    provider: mockProvider,
  });

  if ("error" in result) {
    console.error("FAILED:", result.error);
    process.exit(1);
  }

  const storedAssistant = await prisma.tutorMessage.findFirst({
    where: { conversationId: conv.id, role: "ASSISTANT" },
    orderBy: { createdAt: "desc" },
    select: { responseJson: true },
  });
  const stored = storedAssistant?.responseJson as {
    outcomeContext?: TutorOutcomeContext;
    adaptiveCoachingContext?: TutorAdaptiveCoachingContext;
  } | null;

  const oc = stored?.outcomeContext ?? result.assistantMessage?.response?.outcomeContext;
  const cc = stored?.adaptiveCoachingContext ?? result.assistantMessage?.response?.adaptiveCoachingContext;

  console.log("Outcome context:", oc);
  console.log("Coaching context:", cc);

  const expectedDirective = determineCoachingPolicy({
    outcomeContext: oc,
    progressContext: undefined,
  })?.directive;

  const checks = [
    submission?.scorePercent === 100,
    oc?.outcome?.scorePercent === 100,
    oc?.confidence !== "NONE",
    cc?.directive === expectedDirective,
    cc?.confidence === oc?.confidence,
    result.type === "EXPLANATION",
  ];

  if (checks.every(Boolean)) {
    console.log("BROWSER LOOP SERVICE PATH: PASSED");
  } else {
    console.error("BROWSER LOOP SERVICE PATH: FAILED", checks);
    process.exit(1);
  }

  const reloaded = await prisma.tutorMessage.findMany({
    where: { conversationId: conv.id, role: "ASSISTANT" },
    orderBy: { createdAt: "desc" },
    take: 1,
    select: { responseJson: true },
  });

  const latest = reloaded[0]?.responseJson as Record<string, unknown> | null;
  if (latest?.outcomeContext && latest?.adaptiveCoachingContext) {
    console.log("PERSISTENCE AFTER SEND: PASSED");
  } else {
    console.error("PERSISTENCE AFTER SEND: FAILED");
    process.exit(1);
  }
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
