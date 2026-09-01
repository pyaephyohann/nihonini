-- CreateEnum
CREATE TYPE "LessonCategory" AS ENUM ('VOCABULARY', 'GRAMMAR', 'KANJI', 'READING', 'LISTENING', 'MIXED');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "target_jlpt_level" "JapaneseLevel";

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN "category" "LessonCategory" NOT NULL DEFAULT 'MIXED';

-- CreateIndex
CREATE INDEX "lessons_jlpt_level_id_category_published_idx" ON "lessons"("jlpt_level_id", "category", "published");

