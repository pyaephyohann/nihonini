import "server-only";

import { prisma } from "@/server/db";

export async function findGrammarByLessonId(lessonId: string) {
  return prisma.lessonGrammar.findMany({
    where: { lessonId, lesson: { published: true } },
    orderBy: { order: "asc" },
    include: { grammar: true },
  });
}
