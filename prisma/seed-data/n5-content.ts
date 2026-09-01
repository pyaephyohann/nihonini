export type PartOfSpeech =
  | "NOUN"
  | "VERB"
  | "ADJECTIVE"
  | "ADVERB"
  | "PARTICLE"
  | "EXPRESSION"
  | "OTHER";

export type JapaneseLevelCode = "N5" | "N4" | "N3" | "N2" | "N1";
export type LessonCategorySeed =
  | "VOCABULARY"
  | "GRAMMAR"
  | "KANJI"
  | "READING"
  | "LISTENING"
  | "MIXED";

export type VocabSeed = {
  word: string;
  reading: string;
  meaning: string;
  partOfSpeech: PartOfSpeech;
  exampleSentence?: string;
  exampleReading?: string;
  kanjiChars?: string[];
};

export type KanjiSeed = {
  character: string;
  meaning: string;
  onyomi: string;
  kunyomi: string;
  strokeCount: number;
};

export type GrammarSeed = {
  pattern: string;
  meaning: string;
  explanation: string;
  structure: string;
  exampleSentence?: string;
  exampleReading?: string;
};

export type LessonSeed = {
  slug: string;
  title: string;
  description: string;
  category: LessonCategorySeed;
  order: number;
  estimatedMinutes: number;
  published: boolean;
  vocabulary: VocabSeed[];
  kanji: KanjiSeed[];
  grammar: GrammarSeed[];
};

export const JLPT_LEVELS: {
  code: JapaneseLevelCode;
  name: string;
  description: string;
  order: number;
}[] = [
  {
    code: "N5",
    name: "JLPT N5",
    description: "Beginner Japanese — basic phrases, hiragana, katakana, and essential vocabulary.",
    order: 1,
  },
  {
    code: "N4",
    name: "JLPT N4",
    description: "Elementary Japanese — everyday expressions and basic grammar patterns.",
    order: 2,
  },
  {
    code: "N3",
    name: "JLPT N3",
    description: "Intermediate Japanese — daily conversation and broader vocabulary.",
    order: 3,
  },
  {
    code: "N2",
    name: "JLPT N2",
    description: "Upper intermediate — business and academic Japanese foundations.",
    order: 4,
  },
  {
    code: "N1",
    name: "JLPT N1",
    description: "Advanced Japanese — near-native fluency and complex expressions.",
    order: 5,
  },
];

export const N5_LESSONS: LessonSeed[] = [
  {
    slug: "n5-greetings",
    title: "Greetings",
    description: "Learn essential Japanese greetings for everyday interactions.",
    category: "VOCABULARY",
    order: 1,
    estimatedMinutes: 15,
    published: true,
    vocabulary: [
      { word: "こんにちは", reading: "こんにちは", meaning: "hello (daytime)", partOfSpeech: "EXPRESSION" },
      { word: "おはよう", reading: "おはよう", meaning: "good morning (casual)", partOfSpeech: "EXPRESSION" },
      { word: "おはようございます", reading: "おはようございます", meaning: "good morning (polite)", partOfSpeech: "EXPRESSION" },
      { word: "こんばんは", reading: "こんばんは", meaning: "good evening", partOfSpeech: "EXPRESSION" },
      { word: "さようなら", reading: "さようなら", meaning: "goodbye", partOfSpeech: "EXPRESSION" },
      { word: "ありがとう", reading: "ありがとう", meaning: "thank you (casual)", partOfSpeech: "EXPRESSION" },
      { word: "ありがとうございます", reading: "ありがとうございます", meaning: "thank you (polite)", partOfSpeech: "EXPRESSION" },
      { word: "すみません", reading: "すみません", meaning: "excuse me / sorry", partOfSpeech: "EXPRESSION" },
      { word: "はい", reading: "はい", meaning: "yes", partOfSpeech: "EXPRESSION" },
      { word: "いいえ", reading: "いいえ", meaning: "no", partOfSpeech: "EXPRESSION" },
    ],
    kanji: [
      { character: "早", meaning: "early", onyomi: "ソウ", kunyomi: "はやい", strokeCount: 6 },
      { character: "午", meaning: "noon", onyomi: "ゴ", kunyomi: "うま", strokeCount: 4 },
      { character: "今", meaning: "now", onyomi: "コン", kunyomi: "いま", strokeCount: 4 },
      { character: "晩", meaning: "evening", onyomi: "バン", kunyomi: "ばん", strokeCount: 12 },
    ],
    grammar: [
      {
        pattern: "〜です",
        meaning: "polite copula (is/am/are)",
        explanation: "Used to make polite statements about identity, state, or description.",
        structure: "Noun/Adjective + です",
        exampleSentence: "私は学生です。",
        exampleReading: "わたしはがくせいです。",
      },
      {
        pattern: "〜ます",
        meaning: "polite verb ending",
        explanation: "The polite form of verbs in present tense.",
        structure: "Verb stem + ます",
        exampleSentence: "毎日勉強します。",
        exampleReading: "まいにちべんきょうします。",
      },
    ],
  },
  {
    slug: "n5-self-introduction",
    title: "Self Introduction",
    description: "Introduce yourself with name, nationality, and occupation.",
    category: "GRAMMAR",
    order: 2,
    estimatedMinutes: 20,
    published: true,
    vocabulary: [
      { word: "私", reading: "わたし", meaning: "I, me", partOfSpeech: "NOUN", kanjiChars: ["私"] },
      { word: "名前", reading: "なまえ", meaning: "name", partOfSpeech: "NOUN", kanjiChars: ["名", "前"] },
      { word: "学生", reading: "がくせい", meaning: "student", partOfSpeech: "NOUN", kanjiChars: ["学", "生"] },
      { word: "先生", reading: "せんせい", meaning: "teacher", partOfSpeech: "NOUN", kanjiChars: ["先", "生"] },
      { word: "会社員", reading: "かいしゃいん", meaning: "office worker", partOfSpeech: "NOUN", kanjiChars: ["会", "社", "員"] },
      { word: "国", reading: "くに", meaning: "country", partOfSpeech: "NOUN", kanjiChars: ["国"] },
      { word: "人", reading: "ひと", meaning: "person", partOfSpeech: "NOUN", kanjiChars: ["人"] },
      { word: "〜人", reading: "〜じん", meaning: "person from (nationality)", partOfSpeech: "NOUN" },
      { word: "初めまして", reading: "はじめまして", meaning: "nice to meet you", partOfSpeech: "EXPRESSION", kanjiChars: ["初"] },
      { word: "よろしくお願いします", reading: "よろしくおねがいします", meaning: "pleased to meet you", partOfSpeech: "EXPRESSION", kanjiChars: ["願"] },
    ],
    kanji: [
      { character: "私", meaning: "private, I", onyomi: "シ", kunyomi: "わたし", strokeCount: 7 },
      { character: "名", meaning: "name", onyomi: "メイ", kunyomi: "な", strokeCount: 6 },
      { character: "国", meaning: "country", onyomi: "コク", kunyomi: "くに", strokeCount: 8 },
      { character: "人", meaning: "person", onyomi: "ジン", kunyomi: "ひと", strokeCount: 2 },
    ],
    grammar: [
      {
        pattern: "〜は〜です",
        meaning: "A is B",
        explanation: "Basic sentence pattern for identification.",
        structure: "Topic + は + Noun + です",
        exampleSentence: "私はミラーです。",
        exampleReading: "わたしはミラーです。",
      },
      {
        pattern: "〜から来ました",
        meaning: "came from",
        explanation: "Express where you came from.",
        structure: "Place + から + 来ました",
        exampleSentence: "アメリカから来ました。",
        exampleReading: "アメリカからきました。",
      },
    ],
  },
  {
    slug: "n5-numbers-and-time",
    title: "Numbers and Time",
    description: "Count, tell time, and talk about schedules.",
    category: "KANJI",
    order: 3,
    estimatedMinutes: 20,
    published: true,
    vocabulary: [
      { word: "一", reading: "いち", meaning: "one", partOfSpeech: "NOUN", kanjiChars: ["一"] },
      { word: "二", reading: "に", meaning: "two", partOfSpeech: "NOUN", kanjiChars: ["二"] },
      { word: "三", reading: "さん", meaning: "three", partOfSpeech: "NOUN", kanjiChars: ["三"] },
      { word: "時", reading: "じ", meaning: "o'clock (time counter)", partOfSpeech: "NOUN", kanjiChars: ["時"] },
      { word: "分", reading: "ふん/ぷん", meaning: "minute", partOfSpeech: "NOUN", kanjiChars: ["分"] },
      { word: "今", reading: "いま", meaning: "now", partOfSpeech: "NOUN", kanjiChars: ["今"] },
      { word: "今日", reading: "きょう", meaning: "today", partOfSpeech: "NOUN", kanjiChars: ["今", "日"] },
      { word: "明日", reading: "あした", meaning: "tomorrow", partOfSpeech: "NOUN", kanjiChars: ["明", "日"] },
      { word: "昨日", reading: "きのう", meaning: "yesterday", partOfSpeech: "NOUN", kanjiChars: ["昨", "日"] },
      { word: "何時", reading: "なんじ", meaning: "what time", partOfSpeech: "NOUN", kanjiChars: ["何", "時"] },
    ],
    kanji: [
      { character: "一", meaning: "one", onyomi: "イチ", kunyomi: "ひと", strokeCount: 1 },
      { character: "二", meaning: "two", onyomi: "ニ", kunyomi: "ふた", strokeCount: 2 },
      { character: "三", meaning: "three", onyomi: "サン", kunyomi: "み", strokeCount: 3 },
      { character: "時", meaning: "time", onyomi: "ジ", kunyomi: "とき", strokeCount: 10 },
    ],
    grammar: [
      {
        pattern: "〜時〜分",
        meaning: "telling time",
        explanation: "Express hours and minutes in Japanese.",
        structure: "Number + 時 + Number + 分",
        exampleSentence: "今は三時半です。",
        exampleReading: "いまはさんじはんです。",
      },
      {
        pattern: "〜に",
        meaning: "at (time/place)",
        explanation: "Particle indicating a specific point in time.",
        structure: "Time + に",
        exampleSentence: "七時に起きます。",
        exampleReading: "しちじにおきます。",
      },
    ],
  },
  {
    slug: "n5-family",
    title: "Family",
    description: "Talk about family members and relationships.",
    category: "VOCABULARY",
    order: 4,
    estimatedMinutes: 20,
    published: true,
    vocabulary: [
      { word: "家族", reading: "かぞく", meaning: "family", partOfSpeech: "NOUN", kanjiChars: ["家", "族"] },
      { word: "父", reading: "ちち", meaning: "father (own)", partOfSpeech: "NOUN", kanjiChars: ["父"] },
      { word: "母", reading: "はは", meaning: "mother (own)", partOfSpeech: "NOUN", kanjiChars: ["母"] },
      { word: "兄", reading: "あに", meaning: "older brother", partOfSpeech: "NOUN", kanjiChars: ["兄"] },
      { word: "姉", reading: "あね", meaning: "older sister", partOfSpeech: "NOUN", kanjiChars: ["姉"] },
      { word: "弟", reading: "おとうと", meaning: "younger brother", partOfSpeech: "NOUN", kanjiChars: ["弟"] },
      { word: "妹", reading: "いもうと", meaning: "younger sister", partOfSpeech: "NOUN", kanjiChars: ["妹"] },
      { word: "子供", reading: "こども", meaning: "child", partOfSpeech: "NOUN", kanjiChars: ["子", "供"] },
      { word: "お父さん", reading: "おとうさん", meaning: "father (someone else's)", partOfSpeech: "NOUN", kanjiChars: ["父"] },
      { word: "お母さん", reading: "おかあさん", meaning: "mother (someone else's)", partOfSpeech: "NOUN", kanjiChars: ["母"] },
    ],
    kanji: [
      { character: "家", meaning: "house, family", onyomi: "カ", kunyomi: "いえ", strokeCount: 10 },
      { character: "父", meaning: "father", onyomi: "フ", kunyomi: "ちち", strokeCount: 4 },
      { character: "母", meaning: "mother", onyomi: "ボ", kunyomi: "はは", strokeCount: 5 },
      { character: "兄", meaning: "older brother", onyomi: "ケイ/キョウ", kunyomi: "あに", strokeCount: 5 },
    ],
    grammar: [
      {
        pattern: "〜の",
        meaning: "possessive particle",
        explanation: "Shows possession or relationship between nouns.",
        structure: "Noun + の + Noun",
        exampleSentence: "これは父の本です。",
        exampleReading: "これはちちのほんです。",
      },
      {
        pattern: "〜がいます",
        meaning: "there is / have (living things)",
        explanation: "Express existence of people or animals.",
        structure: "Subject + が + います",
        exampleSentence: "家族が四人います。",
        exampleReading: "かぞくがよにんいます。",
      },
    ],
  },
  {
    slug: "n5-daily-life",
    title: "Daily Life",
    description: "Essential vocabulary for everyday activities in Japan.",
    category: "MIXED",
    order: 5,
    estimatedMinutes: 25,
    published: true,
    vocabulary: [
      { word: "学校", reading: "がっこう", meaning: "school", partOfSpeech: "NOUN", kanjiChars: ["学", "校"] },
      { word: "食べる", reading: "たべる", meaning: "to eat", partOfSpeech: "VERB", kanjiChars: ["食"] },
      { word: "飲む", reading: "のむ", meaning: "to drink", partOfSpeech: "VERB", kanjiChars: ["飲"] },
      { word: "行く", reading: "いく", meaning: "to go", partOfSpeech: "VERB", kanjiChars: ["行"] },
      { word: "来る", reading: "くる", meaning: "to come", partOfSpeech: "VERB", kanjiChars: ["来"] },
      { word: "見る", reading: "みる", meaning: "to see, to watch", partOfSpeech: "VERB", kanjiChars: ["見"] },
      { word: "買う", reading: "かう", meaning: "to buy", partOfSpeech: "VERB", kanjiChars: ["買"] },
      { word: "水", reading: "みず", meaning: "water", partOfSpeech: "NOUN", kanjiChars: ["水"] },
      { word: "ご飯", reading: "ごはん", meaning: "meal, rice", partOfSpeech: "NOUN", kanjiChars: ["飯"] },
      { word: "駅", reading: "えき", meaning: "station", partOfSpeech: "NOUN", kanjiChars: ["駅"] },
    ],
    kanji: [
      { character: "学", meaning: "study, learning", onyomi: "ガク", kunyomi: "まなぶ", strokeCount: 8 },
      { character: "校", meaning: "school", onyomi: "コウ", kunyomi: "—", strokeCount: 10 },
      { character: "食", meaning: "eat, food", onyomi: "ショク", kunyomi: "たべる", strokeCount: 9 },
      { character: "行", meaning: "go", onyomi: "コウ", kunyomi: "いく", strokeCount: 6 },
    ],
    grammar: [
      {
        pattern: "〜を",
        meaning: "object particle",
        explanation: "Marks the direct object of a verb.",
        structure: "Noun + を + Verb",
        exampleSentence: "水を飲みます。",
        exampleReading: "みずをのみます。",
      },
      {
        pattern: "〜に行きます",
        meaning: "go to (place)",
        explanation: "Express going to a destination.",
        structure: "Place + に + 行きます",
        exampleSentence: "学校に行きます。",
        exampleReading: "がっこうにいきます。",
      },
    ],
  },
  {
    slug: "n5-advanced-greetings-draft",
    title: "Advanced Greetings (Draft)",
    description: "Unpublished draft lesson for internal testing.",
    category: "VOCABULARY",
    order: 6,
    estimatedMinutes: 10,
    published: false,
    vocabulary: [],
    kanji: [],
    grammar: [],
  },
];

export const PLACEHOLDER_LESSONS: Record<Exclude<JapaneseLevelCode, "N5">, LessonSeed> = {
  N4: {
    slug: "n4-intro",
    title: "N4 Introduction",
    description: "Placeholder demo lesson for JLPT N4 content.",
    category: "MIXED",
    order: 1,
    estimatedMinutes: 10,
    published: true,
    vocabulary: [
      { word: "準備", reading: "じゅんび", meaning: "preparation", partOfSpeech: "NOUN", kanjiChars: ["準", "備"] },
    ],
    kanji: [{ character: "準", meaning: "prepare", onyomi: "ジュン", kunyomi: "—", strokeCount: 13 }],
    grammar: [
      {
        pattern: "〜てください",
        meaning: "please do",
        explanation: "Polite request form.",
        structure: "Verb te-form + ください",
      },
    ],
  },
  N3: {
    slug: "n3-intro",
    title: "N3 Introduction",
    description: "Placeholder demo lesson for JLPT N3 content.",
    category: "MIXED",
    order: 1,
    estimatedMinutes: 10,
    published: true,
    vocabulary: [{ word: "経験", reading: "けいけん", meaning: "experience", partOfSpeech: "NOUN", kanjiChars: ["経", "験"] }],
    kanji: [{ character: "経", meaning: "pass through", onyomi: "ケイ", kunyomi: "へる", strokeCount: 11 }],
    grammar: [{ pattern: "〜たことがある", meaning: "have done before", explanation: "Express past experience.", structure: "Verb ta-form + ことがある" }],
  },
  N2: {
    slug: "n2-intro",
    title: "N2 Introduction",
    description: "Placeholder demo lesson for JLPT N2 content.",
    category: "MIXED",
    order: 1,
    estimatedMinutes: 10,
    published: true,
    vocabulary: [{ word: "議論", reading: "ぎろん", meaning: "discussion", partOfSpeech: "NOUN", kanjiChars: ["議", "論"] }],
    kanji: [{ character: "議", meaning: "deliberation", onyomi: "ギ", kunyomi: "—", strokeCount: 20 }],
    grammar: [{ pattern: "〜に対して", meaning: "toward, regarding", explanation: "Express direction of action or attitude.", structure: "Noun + に対して" }],
  },
  N1: {
    slug: "n1-intro",
    title: "N1 Introduction",
    description: "Placeholder demo lesson for JLPT N1 content.",
    category: "MIXED",
    order: 1,
    estimatedMinutes: 10,
    published: true,
    vocabulary: [{ word: "抽象", reading: "ちゅうしょう", meaning: "abstract", partOfSpeech: "NOUN", kanjiChars: ["抽", "象"] }],
    kanji: [{ character: "象", meaning: "elephant, phenomenon", onyomi: "ショウ", kunyomi: "—", strokeCount: 12 }],
    grammar: [{ pattern: "〜に至るまで", meaning: "even to the extent of", explanation: "Emphasize range or extremity.", structure: "Noun + に至るまで" }],
  },
};
