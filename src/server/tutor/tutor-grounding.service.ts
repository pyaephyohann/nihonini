import "server-only";

import type { JapaneseLevel } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import type { TutorGroundedContent } from "@/types/tutor";

const MAX_GROUNDED_ITEMS = 5;
const MIN_TOKEN_LENGTH = 2;

function extractSearchTerms(message: string): string[] {
  const japaneseMatches = message.match(/[\u3040-\u30ff\u3400-\u9fff]+/g) ?? [];
  const latinMatches =
    message.match(/[a-zA-Z][a-zA-Z'-]{1,}/g)?.map((term) => term.toLowerCase()) ?? [];

  const terms = [...japaneseMatches, ...latinMatches]
    .map((term) => term.trim())
    .filter((term) => term.length >= MIN_TOKEN_LENGTH);

  return [...new Set(terms)].slice(0, 6);
}

export async function buildTutorGrounding(input: {
  message: string;
  jlptLevel: JapaneseLevel;
}): Promise<TutorGroundedContent[]> {
  const terms = extractSearchTerms(input.message);
  if (terms.length === 0) {
    return [];
  }

  const results: TutorGroundedContent[] = [];
  const seen = new Set<string>();

  const addResult = (item: TutorGroundedContent) => {
    const key = `${item.kind}:${item.id}`;
    if (seen.has(key) || results.length >= MAX_GROUNDED_ITEMS) return;
    seen.add(key);
    results.push(item);
  };

  for (const term of terms) {
    if (results.length >= MAX_GROUNDED_ITEMS) break;

    const vocabularyRows = await prisma.vocabulary.findMany({
      where: {
        jlptLevel: input.jlptLevel,
        OR: [
          { word: { contains: term, mode: "insensitive" } },
          { reading: { contains: term, mode: "insensitive" } },
          { meaning: { contains: term, mode: "insensitive" } },
        ],
      },
      take: 2,
      select: {
        id: true,
        word: true,
        reading: true,
        meaning: true,
        jlptLevel: true,
      },
    });

    for (const row of vocabularyRows) {
      addResult({
        kind: "VOCABULARY",
        id: row.id,
        title: row.word,
        jlptLevel: row.jlptLevel,
        content: `${row.word} (${row.reading}) — ${row.meaning}`,
      });
    }

    const grammarRows = await prisma.grammar.findMany({
      where: {
        jlptLevel: input.jlptLevel,
        OR: [
          { pattern: { contains: term, mode: "insensitive" } },
          { meaning: { contains: term, mode: "insensitive" } },
          { explanation: { contains: term, mode: "insensitive" } },
        ],
      },
      take: 2,
      select: {
        id: true,
        pattern: true,
        meaning: true,
        explanation: true,
        jlptLevel: true,
      },
    });

    for (const row of grammarRows) {
      addResult({
        kind: "GRAMMAR",
        id: row.id,
        title: row.pattern,
        jlptLevel: row.jlptLevel,
        content: `${row.pattern} — ${row.meaning}. ${row.explanation.slice(0, 240)}`,
      });
    }

    const kanjiRows = await prisma.kanji.findMany({
      where: {
        jlptLevel: input.jlptLevel,
        OR: [
          { character: { contains: term } },
          { meaning: { contains: term, mode: "insensitive" } },
        ],
      },
      take: 2,
      select: {
        id: true,
        character: true,
        meaning: true,
        onyomi: true,
        kunyomi: true,
        jlptLevel: true,
      },
    });

    for (const row of kanjiRows) {
      addResult({
        kind: "KANJI",
        id: row.id,
        title: row.character,
        jlptLevel: row.jlptLevel,
        content: `${row.character} — ${row.meaning} (on: ${row.onyomi}, kun: ${row.kunyomi})`,
      });
    }

    const lessonRows = await prisma.lesson.findMany({
      where: {
        published: true,
        jlptLevel: { code: input.jlptLevel },
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
        ],
      },
      take: 1,
      select: {
        id: true,
        title: true,
        description: true,
        jlptLevel: { select: { code: true } },
      },
    });

    for (const row of lessonRows) {
      addResult({
        kind: "LESSON",
        id: row.id,
        title: row.title,
        jlptLevel: row.jlptLevel.code,
        content: row.description.slice(0, 240),
      });
    }
  }

  return results;
}

export function serializeGroundingForPrompt(items: TutorGroundedContent[]): string {
  if (items.length === 0) {
    return "No directly matching Nihonini content was found for this message.";
  }
  return JSON.stringify(items);
}
