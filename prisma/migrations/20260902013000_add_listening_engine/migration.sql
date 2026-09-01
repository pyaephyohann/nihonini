-- CreateTable
CREATE TABLE "listenings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "audio_url" TEXT NOT NULL,
    "transcript" TEXT,
    "duration_seconds" INTEGER,
    "jlpt_level" "JapaneseLevel" NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "estimated_minutes" INTEGER NOT NULL DEFAULT 2,
    "sort_order" INTEGER NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listenings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listening_questions" (
    "id" TEXT NOT NULL,
    "listening_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "explanation" TEXT,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "listening_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listening_question_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "listening_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_listening_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listening_id" TEXT NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "best_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mastery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_listening_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listening_submissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listening_id" TEXT NOT NULL,
    "correct_count" INTEGER NOT NULL,
    "total_count" INTEGER NOT NULL,
    "score_percent" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listening_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listening_question_attempts" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_option_id" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,

    CONSTRAINT "listening_question_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listenings_slug_key" ON "listenings"("slug");

-- CreateIndex
CREATE INDEX "listenings_jlpt_level_published_idx" ON "listenings"("jlpt_level", "published");

-- CreateIndex
CREATE UNIQUE INDEX "listenings_jlpt_level_sort_order_key" ON "listenings"("jlpt_level", "sort_order");

-- CreateIndex
CREATE INDEX "listening_questions_listening_id_idx" ON "listening_questions"("listening_id");

-- CreateIndex
CREATE UNIQUE INDEX "listening_questions_listening_id_sort_order_key" ON "listening_questions"("listening_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "listening_question_options_question_id_sort_order_key" ON "listening_question_options"("question_id", "sort_order");

-- CreateIndex
CREATE INDEX "user_listening_progress_user_id_idx" ON "user_listening_progress"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_listening_progress_user_id_listening_id_key" ON "user_listening_progress"("user_id", "listening_id");

-- CreateIndex
CREATE INDEX "listening_submissions_user_id_idx" ON "listening_submissions"("user_id");

-- CreateIndex
CREATE INDEX "listening_submissions_user_id_listening_id_idx" ON "listening_submissions"("user_id", "listening_id");

-- CreateIndex
CREATE INDEX "listening_submissions_user_id_created_at_idx" ON "listening_submissions"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "listening_question_attempts_submission_id_question_id_key" ON "listening_question_attempts"("submission_id", "question_id");

-- AddForeignKey
ALTER TABLE "listening_questions" ADD CONSTRAINT "listening_questions_listening_id_fkey" FOREIGN KEY ("listening_id") REFERENCES "listenings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_question_options" ADD CONSTRAINT "listening_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "listening_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_listening_progress" ADD CONSTRAINT "user_listening_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_listening_progress" ADD CONSTRAINT "user_listening_progress_listening_id_fkey" FOREIGN KEY ("listening_id") REFERENCES "listenings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_submissions" ADD CONSTRAINT "listening_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_submissions" ADD CONSTRAINT "listening_submissions_listening_id_fkey" FOREIGN KEY ("listening_id") REFERENCES "listenings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_question_attempts" ADD CONSTRAINT "listening_question_attempts_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "listening_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_question_attempts" ADD CONSTRAINT "listening_question_attempts_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "listening_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
