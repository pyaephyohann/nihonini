import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  ExerciseType,
  PrismaClient,
  type JapaneseLevel,
} from "../src/generated/prisma/client";
import {
  JLPT_LEVELS,
  N5_LESSONS,
  PLACEHOLDER_LESSONS,
  type LessonSeed,
  type VocabSeed,
} from "./seed-data/n5-content";

config({ path: ".env.local" });
config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the seed script.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function upsertKanji(
  item: LessonSeed["kanji"][number],
  jlptLevel: JapaneseLevel,
) {
  return prisma.kanji.upsert({
    where: { character: item.character },
    update: {
      meaning: item.meaning,
      onyomi: item.onyomi,
      kunyomi: item.kunyomi,
      strokeCount: item.strokeCount,
      jlptLevel,
    },
    create: {
      character: item.character,
      meaning: item.meaning,
      onyomi: item.onyomi,
      kunyomi: item.kunyomi,
      strokeCount: item.strokeCount,
      jlptLevel,
    },
  });
}

async function upsertVocabulary(
  item: VocabSeed,
  jlptLevel: JapaneseLevel,
) {
  const vocabulary = await prisma.vocabulary.upsert({
    where: {
      word_reading: {
        word: item.word,
        reading: item.reading,
      },
    },
    update: {
      meaning: item.meaning,
      partOfSpeech: item.partOfSpeech,
      exampleSentence: item.exampleSentence,
      exampleReading: item.exampleReading,
      jlptLevel,
    },
    create: {
      word: item.word,
      reading: item.reading,
      meaning: item.meaning,
      partOfSpeech: item.partOfSpeech,
      exampleSentence: item.exampleSentence,
      exampleReading: item.exampleReading,
      jlptLevel,
    },
  });

  if (item.kanjiChars) {
    for (const [index, character] of item.kanjiChars.entries()) {
      const kanji = await prisma.kanji.findUnique({ where: { character } });
      if (kanji) {
        await prisma.vocabularyKanji.upsert({
          where: {
            vocabularyId_kanjiId: {
              vocabularyId: vocabulary.id,
              kanjiId: kanji.id,
            },
          },
          update: { order: index + 1 },
          create: {
            vocabularyId: vocabulary.id,
            kanjiId: kanji.id,
            order: index + 1,
          },
        });
      }
    }
  }

  return vocabulary;
}

async function seedLesson(lesson: LessonSeed, jlptLevelId: string, code: JapaneseLevel) {
  const dbLesson = await prisma.lesson.upsert({
    where: { slug: lesson.slug },
    update: {
      title: lesson.title,
      description: lesson.description,
      order: lesson.order,
      estimatedMinutes: lesson.estimatedMinutes,
      published: lesson.published,
      jlptLevelId,
    },
    create: {
      title: lesson.title,
      slug: lesson.slug,
      description: lesson.description,
      order: lesson.order,
      estimatedMinutes: lesson.estimatedMinutes,
      published: lesson.published,
      jlptLevelId,
    },
  });

  for (const [index, kanjiItem] of lesson.kanji.entries()) {
    const kanji = await upsertKanji(kanjiItem, code);
    await prisma.lessonKanji.upsert({
      where: {
        lessonId_kanjiId: { lessonId: dbLesson.id, kanjiId: kanji.id },
      },
      update: { order: index + 1 },
      create: { lessonId: dbLesson.id, kanjiId: kanji.id, order: index + 1 },
    });
  }

  const vocabRecords = [];
  for (const [index, vocabItem] of lesson.vocabulary.entries()) {
    const vocabulary = await upsertVocabulary(vocabItem, code);
    vocabRecords.push(vocabulary);
    await prisma.lessonVocabulary.upsert({
      where: {
        lessonId_vocabularyId: {
          lessonId: dbLesson.id,
          vocabularyId: vocabulary.id,
        },
      },
      update: { order: index + 1 },
      create: {
        lessonId: dbLesson.id,
        vocabularyId: vocabulary.id,
        order: index + 1,
      },
    });
  }

  for (const [index, grammarItem] of lesson.grammar.entries()) {
    const grammar = await prisma.grammar.upsert({
      where: {
        pattern_meaning: {
          pattern: grammarItem.pattern,
          meaning: grammarItem.meaning,
        },
      },
      update: {
        explanation: grammarItem.explanation,
        structure: grammarItem.structure,
        exampleSentence: grammarItem.exampleSentence,
        exampleReading: grammarItem.exampleReading,
        jlptLevel: code,
      },
      create: {
        pattern: grammarItem.pattern,
        meaning: grammarItem.meaning,
        explanation: grammarItem.explanation,
        structure: grammarItem.structure,
        exampleSentence: grammarItem.exampleSentence,
        exampleReading: grammarItem.exampleReading,
        jlptLevel: code,
      },
    });

    await prisma.lessonGrammar.upsert({
      where: {
        lessonId_grammarId: { lessonId: dbLesson.id, grammarId: grammar.id },
      },
      update: { order: index + 1 },
      create: { lessonId: dbLesson.id, grammarId: grammar.id, order: index + 1 },
    });
  }

  if (lesson.published && vocabRecords.length > 0) {
    await seedExercisesForLesson(dbLesson.id, vocabRecords, lesson.grammar);
  }

  return dbLesson;
}

async function seedExercisesForLesson(
  lessonId: string,
  vocabulary: { id: string; word: string; meaning: string; reading: string }[],
  grammar: LessonSeed["grammar"],
) {
  const distractors = [
    "Hospital",
    "Station",
    "Company",
    "Teacher",
    "Yesterday",
    "Tomorrow",
    "Brother",
    "Water",
    "Book",
    "City",
  ];

  let exerciseOrder = 1;

  for (const vocab of vocabulary) {
    if (exerciseOrder > 10) break;

    const exercise = await prisma.exercise.upsert({
      where: {
        lessonId_order: { lessonId, order: exerciseOrder },
      },
      update: {
        type: ExerciseType.MULTIPLE_CHOICE,
        question: `${vocab.word} means:`,
        explanation: `${vocab.word} (${vocab.reading}) means "${vocab.meaning}".`,
        difficulty: 1,
        points: 10,
      },
      create: {
        lessonId,
        type: ExerciseType.MULTIPLE_CHOICE,
        question: `${vocab.word} means:`,
        explanation: `${vocab.word} (${vocab.reading}) means "${vocab.meaning}".`,
        difficulty: 1,
        points: 10,
        order: exerciseOrder,
      },
    });

    const wrongOptions = distractors
      .filter((d) => d.toLowerCase() !== vocab.meaning.toLowerCase())
      .slice(0, 3);

    const options = [
      { text: vocab.meaning, isCorrect: true },
      ...wrongOptions.map((text) => ({ text, isCorrect: false })),
    ].sort(() => Math.random() - 0.5);

    for (const [index, option] of options.entries()) {
      await prisma.exerciseOption.upsert({
        where: {
          exerciseId_order: { exerciseId: exercise.id, order: index + 1 },
        },
        update: { text: option.text, isCorrect: option.isCorrect },
        create: {
          exerciseId: exercise.id,
          text: option.text,
          isCorrect: option.isCorrect,
          order: index + 1,
        },
      });
    }

    exerciseOrder += 1;
  }

  for (const grammarItem of grammar) {
    if (exerciseOrder > 10) break;

    const exercise = await prisma.exercise.upsert({
      where: {
        lessonId_order: { lessonId, order: exerciseOrder },
      },
      update: {
        type: ExerciseType.FILL_BLANK,
        question: `What is the meaning of the grammar pattern "${grammarItem.pattern}"?`,
        explanation: grammarItem.explanation,
        difficulty: 2,
        points: 15,
      },
      create: {
        lessonId,
        type: ExerciseType.FILL_BLANK,
        question: `What is the meaning of the grammar pattern "${grammarItem.pattern}"?`,
        explanation: grammarItem.explanation,
        difficulty: 2,
        points: 15,
        order: exerciseOrder,
      },
    });

    await prisma.exerciseOption.upsert({
      where: {
        exerciseId_order: { exerciseId: exercise.id, order: 1 },
      },
      update: { text: grammarItem.meaning, isCorrect: true },
      create: {
        exerciseId: exercise.id,
        text: grammarItem.meaning,
        isCorrect: true,
        order: 1,
      },
    });

    exerciseOrder += 1;
  }
}

async function main() {
  console.log("Seeding Nihonini learning content...");

  const levelMap = new Map<JapaneseLevel, string>();

  for (const level of JLPT_LEVELS) {
    const record = await prisma.jlptLevel.upsert({
      where: { code: level.code },
      update: {
        name: level.name,
        description: level.description,
        order: level.order,
      },
      create: {
        code: level.code,
        name: level.name,
        description: level.description,
        order: level.order,
      },
    });
    levelMap.set(level.code, record.id);
  }

  const n5LevelId = levelMap.get("N5");
  if (!n5LevelId) throw new Error("N5 level missing");

  for (const lesson of N5_LESSONS) {
    await seedLesson(lesson, n5LevelId, "N5");
    console.log(`  ✓ Lesson: ${lesson.slug}`);
  }

  for (const [code, lesson] of Object.entries(PLACEHOLDER_LESSONS) as [
    Exclude<JapaneseLevel, "N5">,
    LessonSeed,
  ][]) {
    const levelId = levelMap.get(code);
    if (levelId) {
      await seedLesson(lesson, levelId, code);
      console.log(`  ✓ Placeholder: ${lesson.slug}`);
    }
  }

  const counts = {
    levels: await prisma.jlptLevel.count(),
    lessons: await prisma.lesson.count(),
    vocabulary: await prisma.vocabulary.count(),
    kanji: await prisma.kanji.count(),
    grammar: await prisma.grammar.count(),
    exercises: await prisma.exercise.count(),
  };

  console.log("\nSeed complete:");
  console.log(`  JLPT levels: ${counts.levels}`);
  console.log(`  Lessons: ${counts.lessons}`);
  console.log(`  Vocabulary: ${counts.vocabulary}`);
  console.log(`  Kanji: ${counts.kanji}`);
  console.log(`  Grammar: ${counts.grammar}`);
  console.log(`  Exercises: ${counts.exercises}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
