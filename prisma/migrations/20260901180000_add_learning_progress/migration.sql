-- CreateEnum
CREATE TYPE "LessonProgressStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "daily_goal" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "exercise_vocabularies" (
    "id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "vocabulary_id" TEXT NOT NULL,

    CONSTRAINT "exercise_vocabularies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_grammars" (
    "id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "grammar_id" TEXT NOT NULL,

    CONSTRAINT "exercise_grammars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_kanji" (
    "id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "kanji_id" TEXT NOT NULL,

    CONSTRAINT "exercise_kanji_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_attempts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "answer" JSONB NOT NULL,
    "time_spent_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_lesson_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "status" "LessonProgressStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_vocabulary_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vocabulary_id" TEXT NOT NULL,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "incorrect_count" INTEGER NOT NULL DEFAULT 0,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "mastery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_reviewed_at" TIMESTAMP(3),
    "next_review_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_vocabulary_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_grammar_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "grammar_id" TEXT NOT NULL,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "incorrect_count" INTEGER NOT NULL DEFAULT 0,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "mastery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_reviewed_at" TIMESTAMP(3),
    "next_review_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_grammar_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_kanji_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kanji_id" TEXT NOT NULL,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "incorrect_count" INTEGER NOT NULL DEFAULT 0,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "mastery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_reviewed_at" TIMESTAMP(3),
    "next_review_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_kanji_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exercise_vocabularies_exercise_id_vocabulary_id_key" ON "exercise_vocabularies"("exercise_id", "vocabulary_id");
CREATE INDEX "exercise_vocabularies_vocabulary_id_idx" ON "exercise_vocabularies"("vocabulary_id");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_grammars_exercise_id_grammar_id_key" ON "exercise_grammars"("exercise_id", "grammar_id");
CREATE INDEX "exercise_grammars_grammar_id_idx" ON "exercise_grammars"("grammar_id");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_kanji_exercise_id_kanji_id_key" ON "exercise_kanji"("exercise_id", "kanji_id");
CREATE INDEX "exercise_kanji_kanji_id_idx" ON "exercise_kanji"("kanji_id");

-- CreateIndex
CREATE INDEX "practice_attempts_user_id_idx" ON "practice_attempts"("user_id");
CREATE INDEX "practice_attempts_exercise_id_idx" ON "practice_attempts"("exercise_id");
CREATE INDEX "practice_attempts_user_id_created_at_idx" ON "practice_attempts"("user_id", "created_at");
CREATE INDEX "practice_attempts_lesson_id_idx" ON "practice_attempts"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_lesson_progress_user_id_lesson_id_key" ON "user_lesson_progress"("user_id", "lesson_id");
CREATE INDEX "user_lesson_progress_user_id_idx" ON "user_lesson_progress"("user_id");
CREATE INDEX "user_lesson_progress_user_id_status_idx" ON "user_lesson_progress"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_vocabulary_progress_user_id_vocabulary_id_key" ON "user_vocabulary_progress"("user_id", "vocabulary_id");
CREATE INDEX "user_vocabulary_progress_user_id_idx" ON "user_vocabulary_progress"("user_id");
CREATE INDEX "user_vocabulary_progress_user_id_next_review_at_idx" ON "user_vocabulary_progress"("user_id", "next_review_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_grammar_progress_user_id_grammar_id_key" ON "user_grammar_progress"("user_id", "grammar_id");
CREATE INDEX "user_grammar_progress_user_id_idx" ON "user_grammar_progress"("user_id");
CREATE INDEX "user_grammar_progress_user_id_next_review_at_idx" ON "user_grammar_progress"("user_id", "next_review_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_kanji_progress_user_id_kanji_id_key" ON "user_kanji_progress"("user_id", "kanji_id");
CREATE INDEX "user_kanji_progress_user_id_idx" ON "user_kanji_progress"("user_id");
CREATE INDEX "user_kanji_progress_user_id_next_review_at_idx" ON "user_kanji_progress"("user_id", "next_review_at");

-- AddForeignKey
ALTER TABLE "exercise_vocabularies" ADD CONSTRAINT "exercise_vocabularies_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exercise_vocabularies" ADD CONSTRAINT "exercise_vocabularies_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_grammars" ADD CONSTRAINT "exercise_grammars_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exercise_grammars" ADD CONSTRAINT "exercise_grammars_grammar_id_fkey" FOREIGN KEY ("grammar_id") REFERENCES "grammars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_kanji" ADD CONSTRAINT "exercise_kanji_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exercise_kanji" ADD CONSTRAINT "exercise_kanji_kanji_id_fkey" FOREIGN KEY ("kanji_id") REFERENCES "kanji"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocabulary_progress" ADD CONSTRAINT "user_vocabulary_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_vocabulary_progress" ADD CONSTRAINT "user_vocabulary_progress_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_grammar_progress" ADD CONSTRAINT "user_grammar_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_grammar_progress" ADD CONSTRAINT "user_grammar_progress_grammar_id_fkey" FOREIGN KEY ("grammar_id") REFERENCES "grammars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_kanji_progress" ADD CONSTRAINT "user_kanji_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_kanji_progress" ADD CONSTRAINT "user_kanji_progress_kanji_id_fkey" FOREIGN KEY ("kanji_id") REFERENCES "kanji"("id") ON DELETE CASCADE ON UPDATE CASCADE;
