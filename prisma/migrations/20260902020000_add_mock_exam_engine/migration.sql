-- CreateEnum
CREATE TYPE "MockExamSkill" AS ENUM ('VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING');

-- CreateEnum
CREATE TYPE "MockExamQuestionType" AS ENUM ('SINGLE_CHOICE');

-- CreateEnum
CREATE TYPE "MockExamSessionStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "mock_exams" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "jlpt_level_id" TEXT NOT NULL,
    "description" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "duration_seconds" INTEGER NOT NULL,
    "question_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mock_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_exam_sections" (
    "id" TEXT NOT NULL,
    "mock_exam_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "skill" "MockExamSkill" NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "duration_seconds" INTEGER,
    "reading_id" TEXT,
    "listening_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mock_exam_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_exam_questions" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_type" "MockExamQuestionType" NOT NULL DEFAULT 'SINGLE_CHOICE',
    "explanation" TEXT,
    "exercise_id" TEXT,
    "reading_question_id" TEXT,
    "listening_question_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mock_exam_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_exam_question_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "mock_exam_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_mock_exam_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mock_exam_id" TEXT NOT NULL,
    "status" "MockExamSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "score_percent" INTEGER,
    "correct_count" INTEGER,
    "total_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_mock_exam_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_mock_exam_session_questions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "mock_exam_question_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "user_mock_exam_session_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_mock_exam_answers" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "mock_exam_question_id" TEXT NOT NULL,
    "selected_option_id" TEXT NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_mock_exam_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_mock_exam_section_results" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "correct_count" INTEGER NOT NULL,
    "total_count" INTEGER NOT NULL,
    "score_percent" INTEGER NOT NULL,

    CONSTRAINT "user_mock_exam_section_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mock_exams_slug_key" ON "mock_exams"("slug");

-- CreateIndex
CREATE INDEX "mock_exams_jlpt_level_id_published_idx" ON "mock_exams"("jlpt_level_id", "published");

-- CreateIndex
CREATE UNIQUE INDEX "mock_exam_sections_mock_exam_id_sort_order_key" ON "mock_exam_sections"("mock_exam_id", "sort_order");

-- CreateIndex
CREATE INDEX "mock_exam_sections_mock_exam_id_sort_order_idx" ON "mock_exam_sections"("mock_exam_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "mock_exam_questions_section_id_sort_order_key" ON "mock_exam_questions"("section_id", "sort_order");

-- CreateIndex
CREATE INDEX "mock_exam_questions_section_id_sort_order_idx" ON "mock_exam_questions"("section_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "mock_exam_question_options_question_id_sort_order_key" ON "mock_exam_question_options"("question_id", "sort_order");

-- CreateIndex
CREATE INDEX "user_mock_exam_sessions_user_id_status_idx" ON "user_mock_exam_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_mock_exam_sessions_user_id_created_at_idx" ON "user_mock_exam_sessions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_mock_exam_sessions_mock_exam_id_idx" ON "user_mock_exam_sessions"("mock_exam_id");

-- CreateIndex
CREATE INDEX "user_mock_exam_sessions_user_id_mock_exam_id_status_idx" ON "user_mock_exam_sessions"("user_id", "mock_exam_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_mock_exam_session_questions_session_id_mock_exam_quest_key" ON "user_mock_exam_session_questions"("session_id", "mock_exam_question_id");

-- CreateIndex
CREATE INDEX "user_mock_exam_session_questions_session_id_sort_order_idx" ON "user_mock_exam_session_questions"("session_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "user_mock_exam_answers_session_id_mock_exam_question_id_key" ON "user_mock_exam_answers"("session_id", "mock_exam_question_id");

-- CreateIndex
CREATE INDEX "user_mock_exam_answers_session_id_idx" ON "user_mock_exam_answers"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_mock_exam_section_results_session_id_section_id_key" ON "user_mock_exam_section_results"("session_id", "section_id");

-- AddForeignKey
ALTER TABLE "mock_exams" ADD CONSTRAINT "mock_exams_jlpt_level_id_fkey" FOREIGN KEY ("jlpt_level_id") REFERENCES "jlpt_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_exam_sections" ADD CONSTRAINT "mock_exam_sections_mock_exam_id_fkey" FOREIGN KEY ("mock_exam_id") REFERENCES "mock_exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_exam_sections" ADD CONSTRAINT "mock_exam_sections_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "readings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_exam_sections" ADD CONSTRAINT "mock_exam_sections_listening_id_fkey" FOREIGN KEY ("listening_id") REFERENCES "listenings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_exam_questions" ADD CONSTRAINT "mock_exam_questions_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "mock_exam_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_exam_questions" ADD CONSTRAINT "mock_exam_questions_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_exam_questions" ADD CONSTRAINT "mock_exam_questions_reading_question_id_fkey" FOREIGN KEY ("reading_question_id") REFERENCES "reading_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_exam_questions" ADD CONSTRAINT "mock_exam_questions_listening_question_id_fkey" FOREIGN KEY ("listening_question_id") REFERENCES "listening_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_exam_question_options" ADD CONSTRAINT "mock_exam_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "mock_exam_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mock_exam_sessions" ADD CONSTRAINT "user_mock_exam_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mock_exam_sessions" ADD CONSTRAINT "user_mock_exam_sessions_mock_exam_id_fkey" FOREIGN KEY ("mock_exam_id") REFERENCES "mock_exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mock_exam_session_questions" ADD CONSTRAINT "user_mock_exam_session_questions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "user_mock_exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mock_exam_session_questions" ADD CONSTRAINT "user_mock_exam_session_questions_mock_exam_question_id_fkey" FOREIGN KEY ("mock_exam_question_id") REFERENCES "mock_exam_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mock_exam_answers" ADD CONSTRAINT "user_mock_exam_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "user_mock_exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mock_exam_answers" ADD CONSTRAINT "user_mock_exam_answers_mock_exam_question_id_fkey" FOREIGN KEY ("mock_exam_question_id") REFERENCES "mock_exam_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mock_exam_answers" ADD CONSTRAINT "user_mock_exam_answers_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "mock_exam_question_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mock_exam_section_results" ADD CONSTRAINT "user_mock_exam_section_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "user_mock_exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mock_exam_section_results" ADD CONSTRAINT "user_mock_exam_section_results_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "mock_exam_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
