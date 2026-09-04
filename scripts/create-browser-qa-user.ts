import Module from "node:module";
import { config } from "dotenv";

config({ path: ".env.local" });

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

async function main() {
  const bcrypt = await import("bcrypt");
  const { prisma } = await import("../src/server/db");
  const email = "m965browser@example.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("USER_EXISTS", existing.id);
    return;
  }
  const hash = await bcrypt.hash("TestPass123!", 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hash,
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
  });
  console.log("USER_CREATED", user.id);
}

main()
  .catch(console.error)
  .finally(async () => {
    const { prisma } = await import("../src/server/db");
    await prisma.$disconnect();
  });
