import "server-only";

import { prisma } from "@/server/db";

export async function findVocabularyByLessonId(lessonId: string) {
  return prisma.lessonVocabulary.findMany({
    where: { lessonId, lesson: { published: true } },
    orderBy: { order: "asc" },
    include: { vocabulary: true },
  });
}
