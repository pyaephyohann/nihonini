import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  ExerciseType,
  type LessonCategory,
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
import { ALL_READINGS, type ReadingSeed } from "./seed-data/readings";

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
      category: lesson.category as LessonCategory,
      order: lesson.order,
      estimatedMinutes: lesson.estimatedMinutes,
      published: lesson.published,
      jlptLevelId,
    },
    create: {
      title: lesson.title,
      slug: lesson.slug,
      description: lesson.description,
      category: lesson.category as LessonCategory,
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

  const vocabRecords: { id: string; word: string; meaning: string; reading: string }[] = [];
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

  const grammarRecords: { id: string; pattern: string; meaning: string }[] = [];
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
    grammarRecords.push({
      id: grammar.id,
      pattern: grammar.pattern,
      meaning: grammar.meaning,
    });
  }

  if (lesson.published && vocabRecords.length > 0) {
    await seedExercisesForLesson(dbLesson.id, vocabRecords, grammarRecords);
  }

  return dbLesson;
}

async function seedExercisesForLesson(
  lessonId: string,
  vocabulary: { id: string; word: string; meaning: string; reading: string }[],
  grammar: { id: string; pattern: string; meaning: string }[],
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

  for (const [vocabIndex, vocab] of vocabulary.entries()) {
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
    ];
    const shift = vocabIndex % options.length;
    const rotated = options.slice(shift).concat(options.slice(0, shift));

    for (const [index, option] of rotated.entries()) {
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

    await prisma.exerciseVocabulary.upsert({
      where: {
        exerciseId_vocabularyId: {
          exerciseId: exercise.id,
          vocabularyId: vocab.id,
        },
      },
      update: {},
      create: {
        exerciseId: exercise.id,
        vocabularyId: vocab.id,
      },
    });

    const vocabKanji = await prisma.vocabularyKanji.findMany({
      where: { vocabularyId: vocab.id },
      select: { kanjiId: true },
    });
    for (const link of vocabKanji) {
      await prisma.exerciseKanji.upsert({
        where: {
          exerciseId_kanjiId: {
            exerciseId: exercise.id,
            kanjiId: link.kanjiId,
          },
        },
        update: {},
        create: {
          exerciseId: exercise.id,
          kanjiId: link.kanjiId,
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
        explanation: `Grammar pattern ${grammarItem.pattern} means "${grammarItem.meaning}".`,
        difficulty: 2,
        points: 15,
      },
      create: {
        lessonId,
        type: ExerciseType.FILL_BLANK,
        question: `What is the meaning of the grammar pattern "${grammarItem.pattern}"?`,
        explanation: `Grammar pattern ${grammarItem.pattern} means "${grammarItem.meaning}".`,
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

    await prisma.exerciseGrammar.upsert({
      where: {
        exerciseId_grammarId: {
          exerciseId: exercise.id,
          grammarId: grammarItem.id,
        },
      },
      update: {},
      create: {
        exerciseId: exercise.id,
        grammarId: grammarItem.id,
      },
    });

    exerciseOrder += 1;
  }
}

async function seedReading(reading: ReadingSeed) {
  const record = await prisma.reading.upsert({
    where: { slug: reading.slug },
    update: {
      title: reading.title,
      subtitle: reading.subtitle ?? null,
      description: reading.description ?? null,
      passage: reading.passage,
      jlptLevel: reading.jlptLevel,
      difficulty: reading.difficulty,
      estimatedMinutes: reading.estimatedMinutes,
      order: reading.order,
      published: reading.published,
    },
    create: {
      title: reading.title,
      slug: reading.slug,
      subtitle: reading.subtitle ?? null,
      description: reading.description ?? null,
      passage: reading.passage,
      jlptLevel: reading.jlptLevel,
      difficulty: reading.difficulty,
      estimatedMinutes: reading.estimatedMinutes,
      order: reading.order,
      published: reading.published,
    },
  });

  for (const [questionIndex, question] of reading.questions.entries()) {
    const questionRecord = await prisma.readingQuestion.upsert({
      where: {
        readingId_order: {
          readingId: record.id,
          order: questionIndex + 1,
        },
      },
      update: {
        question: question.question,
        explanation: question.explanation ?? null,
      },
      create: {
        readingId: record.id,
        question: question.question,
        explanation: question.explanation ?? null,
        order: questionIndex + 1,
      },
    });

    for (const [optionIndex, option] of question.options.entries()) {
      await prisma.readingQuestionOption.upsert({
        where: {
          questionId_order: {
            questionId: questionRecord.id,
            order: optionIndex + 1,
          },
        },
        update: {
          text: option.text,
          isCorrect: option.isCorrect,
        },
        create: {
          questionId: questionRecord.id,
          text: option.text,
          isCorrect: option.isCorrect,
          order: optionIndex + 1,
        },
      });
    }
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

  console.log("\nSeeding readings...");
  for (const reading of ALL_READINGS) {
    await seedReading(reading);
    console.log(`  ✓ Reading: ${reading.slug}`);
  }

  const counts = {
    levels: await prisma.jlptLevel.count(),
    lessons: await prisma.lesson.count(),
    vocabulary: await prisma.vocabulary.count(),
    kanji: await prisma.kanji.count(),
    grammar: await prisma.grammar.count(),
    exercises: await prisma.exercise.count(),
    readings: await prisma.reading.count({ where: { published: true } }),
    readingQuestions: await prisma.readingQuestion.count(),
  };

  console.log("\nSeed complete:");
  console.log(`  JLPT levels: ${counts.levels}`);
  console.log(`  Lessons: ${counts.lessons}`);
  console.log(`  Vocabulary: ${counts.vocabulary}`);
  console.log(`  Kanji: ${counts.kanji}`);
  console.log(`  Grammar: ${counts.grammar}`);
  console.log(`  Exercises: ${counts.exercises}`);
  console.log(`  Published readings: ${counts.readings}`);
  console.log(`  Reading questions: ${counts.readingQuestions}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
