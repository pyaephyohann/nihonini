import "server-only";

import { prisma } from "@/server/db";

export async function findKanjiByLessonId(lessonId: string) {
  return prisma.lessonKanji.findMany({
    where: { lessonId, lesson: { published: true } },
    orderBy: { order: "asc" },
    include: { kanji: true },
  });
}
