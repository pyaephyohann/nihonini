-- CreateEnum
CREATE TYPE "PartOfSpeech" AS ENUM ('NOUN', 'VERB', 'ADJECTIVE', 'ADVERB', 'PARTICLE', 'EXPRESSION', 'OTHER');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('MULTIPLE_CHOICE', 'FILL_BLANK', 'TRANSLATION', 'ORDERING', 'MATCHING');

-- CreateTable
CREATE TABLE "jlpt_levels" (
    "id" TEXT NOT NULL,
    "code" "JapaneseLevel" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jlpt_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "jlpt_level_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "estimated_minutes" INTEGER NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabularies" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "reading" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "part_of_speech" "PartOfSpeech" NOT NULL,
    "jlpt_level" "JapaneseLevel" NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "example_sentence" TEXT,
    "example_reading" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vocabularies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grammars" (
    "id" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "structure" TEXT NOT NULL,
    "jlpt_level" "JapaneseLevel" NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "example_sentence" TEXT,
    "example_reading" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grammars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanji" (
    "id" TEXT NOT NULL,
    "character" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "onyomi" TEXT NOT NULL,
    "kunyomi" TEXT NOT NULL,
    "jlpt_level" "JapaneseLevel" NOT NULL,
    "stroke_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanji_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_vocabularies" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "vocabulary_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "lesson_vocabularies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_grammars" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "grammar_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "lesson_grammars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_kanji" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "kanji_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "lesson_kanji_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_kanji" (
    "id" TEXT NOT NULL,
    "vocabulary_id" TEXT NOT NULL,
    "kanji_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "vocabulary_kanji_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "question" TEXT NOT NULL,
    "explanation" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "points" INTEGER NOT NULL DEFAULT 10,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_options" (
    "id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "exercise_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jlpt_levels_code_key" ON "jlpt_levels"("code");

-- CreateIndex
CREATE UNIQUE INDEX "jlpt_levels_sort_order_key" ON "jlpt_levels"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_slug_key" ON "lessons"("slug");

-- CreateIndex
CREATE INDEX "lessons_jlpt_level_id_published_idx" ON "lessons"("jlpt_level_id", "published");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_jlpt_level_id_sort_order_key" ON "lessons"("jlpt_level_id", "sort_order");

-- CreateIndex
CREATE INDEX "vocabularies_jlpt_level_idx" ON "vocabularies"("jlpt_level");

-- CreateIndex
CREATE UNIQUE INDEX "vocabularies_word_reading_key" ON "vocabularies"("word", "reading");

-- CreateIndex
CREATE INDEX "grammars_jlpt_level_idx" ON "grammars"("jlpt_level");

-- CreateIndex
CREATE UNIQUE INDEX "grammars_pattern_meaning_key" ON "grammars"("pattern", "meaning");

-- CreateIndex
CREATE UNIQUE INDEX "kanji_character_key" ON "kanji"("character");

-- CreateIndex
CREATE INDEX "kanji_jlpt_level_idx" ON "kanji"("jlpt_level");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_vocabularies_lesson_id_vocabulary_id_key" ON "lesson_vocabularies"("lesson_id", "vocabulary_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_vocabularies_lesson_id_sort_order_key" ON "lesson_vocabularies"("lesson_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_grammars_lesson_id_grammar_id_key" ON "lesson_grammars"("lesson_id", "grammar_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_grammars_lesson_id_sort_order_key" ON "lesson_grammars"("lesson_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_kanji_lesson_id_kanji_id_key" ON "lesson_kanji"("lesson_id", "kanji_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_kanji_lesson_id_sort_order_key" ON "lesson_kanji"("lesson_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_kanji_vocabulary_id_kanji_id_key" ON "vocabulary_kanji"("vocabulary_id", "kanji_id");

-- CreateIndex
CREATE INDEX "exercises_lesson_id_idx" ON "exercises"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_lesson_id_sort_order_key" ON "exercises"("lesson_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_options_exercise_id_sort_order_key" ON "exercise_options"("exercise_id", "sort_order");

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_jlpt_level_id_fkey" FOREIGN KEY ("jlpt_level_id") REFERENCES "jlpt_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_vocabularies" ADD CONSTRAINT "lesson_vocabularies_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_vocabularies" ADD CONSTRAINT "lesson_vocabularies_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_grammars" ADD CONSTRAINT "lesson_grammars_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_grammars" ADD CONSTRAINT "lesson_grammars_grammar_id_fkey" FOREIGN KEY ("grammar_id") REFERENCES "grammars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_kanji" ADD CONSTRAINT "lesson_kanji_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_kanji" ADD CONSTRAINT "lesson_kanji_kanji_id_fkey" FOREIGN KEY ("kanji_id") REFERENCES "kanji"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_kanji" ADD CONSTRAINT "vocabulary_kanji_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_kanji" ADD CONSTRAINT "vocabulary_kanji_kanji_id_fkey" FOREIGN KEY ("kanji_id") REFERENCES "kanji"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_options" ADD CONSTRAINT "exercise_options_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
