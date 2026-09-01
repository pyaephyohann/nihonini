-- CreateTable
CREATE TABLE "readings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "passage" TEXT NOT NULL,
    "jlpt_level" "JapaneseLevel" NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "estimated_minutes" INTEGER NOT NULL DEFAULT 3,
    "sort_order" INTEGER NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_questions" (
    "id" TEXT NOT NULL,
    "reading_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "explanation" TEXT,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "reading_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_question_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "reading_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reading_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reading_id" TEXT NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "best_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mastery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_reading_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_submissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reading_id" TEXT NOT NULL,
    "correct_count" INTEGER NOT NULL,
    "total_count" INTEGER NOT NULL,
    "score_percent" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_question_attempts" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_option_id" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,

    CONSTRAINT "reading_question_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "readings_slug_key" ON "readings"("slug");

-- CreateIndex
CREATE INDEX "readings_jlpt_level_published_idx" ON "readings"("jlpt_level", "published");

-- CreateIndex
CREATE UNIQUE INDEX "readings_jlpt_level_sort_order_key" ON "readings"("jlpt_level", "sort_order");

-- CreateIndex
CREATE INDEX "reading_questions_reading_id_idx" ON "reading_questions"("reading_id");

-- CreateIndex
CREATE UNIQUE INDEX "reading_questions_reading_id_sort_order_key" ON "reading_questions"("reading_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "reading_question_options_question_id_sort_order_key" ON "reading_question_options"("question_id", "sort_order");

-- CreateIndex
CREATE INDEX "user_reading_progress_user_id_idx" ON "user_reading_progress"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_reading_progress_user_id_reading_id_key" ON "user_reading_progress"("user_id", "reading_id");

-- CreateIndex
CREATE INDEX "reading_submissions_user_id_idx" ON "reading_submissions"("user_id");

-- CreateIndex
CREATE INDEX "reading_submissions_user_id_reading_id_idx" ON "reading_submissions"("user_id", "reading_id");

-- CreateIndex
CREATE INDEX "reading_submissions_user_id_created_at_idx" ON "reading_submissions"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "reading_question_attempts_submission_id_question_id_key" ON "reading_question_attempts"("submission_id", "question_id");

-- AddForeignKey
ALTER TABLE "reading_questions" ADD CONSTRAINT "reading_questions_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_question_options" ADD CONSTRAINT "reading_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "reading_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reading_progress" ADD CONSTRAINT "user_reading_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reading_progress" ADD CONSTRAINT "user_reading_progress_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_submissions" ADD CONSTRAINT "reading_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_submissions" ADD CONSTRAINT "reading_submissions_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_question_attempts" ADD CONSTRAINT "reading_question_attempts_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "reading_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_question_attempts" ADD CONSTRAINT "reading_question_attempts_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "reading_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
