import type { JapaneseLevel } from "../../src/generated/prisma/client";

export type ReadingOptionSeed = {
  text: string;
  isCorrect: boolean;
};

export type ReadingQuestionSeed = {
  question: string;
  explanation?: string;
  options: ReadingOptionSeed[];
};

export type ReadingSeed = {
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  passage: string;
  jlptLevel: JapaneseLevel;
  difficulty: number;
  estimatedMinutes: number;
  order: number;
  published: boolean;
  questions: ReadingQuestionSeed[];
};

export const N5_READINGS: ReadingSeed[] = [
  {
    slug: "my-sunday",
    title: "My Sunday",
    subtitle: "日曜日の一日",
    description: "A simple day-in-the-life passage for N5 learners.",
    jlptLevel: "N5",
    difficulty: 1,
    estimatedMinutes: 3,
    order: 1,
    published: true,
    passage: `今日は日曜日です。
私は朝七時に起きました。
朝ごはんを食べて、公園へ行きました。
公園で友だちとサッカーをしました。
午後は本を読みました。
夜、家族と一緒にごはんを食べました。`,
    questions: [
      {
        question: "What day is it in the passage?",
        explanation: "The first sentence says 今日は日曜日です (Today is Sunday).",
        options: [
          { text: "Saturday", isCorrect: false },
          { text: "Sunday", isCorrect: true },
          { text: "Monday", isCorrect: false },
          { text: "Friday", isCorrect: false },
        ],
      },
      {
        question: "What time did the writer wake up?",
        explanation: "The passage says 朝七時に起きました (woke up at 7 in the morning).",
        options: [
          { text: "6:00", isCorrect: false },
          { text: "7:00", isCorrect: true },
          { text: "8:00", isCorrect: false },
          { text: "9:00", isCorrect: false },
        ],
      },
      {
        question: "Where did the writer go after breakfast?",
        explanation: "After eating breakfast, they went to the park (公園へ行きました).",
        options: [
          { text: "School", isCorrect: false },
          { text: "The park", isCorrect: true },
          { text: "The library", isCorrect: false },
          { text: "A restaurant", isCorrect: false },
        ],
      },
      {
        question: "What did the writer do in the afternoon?",
        explanation: "The passage says 午後は本を読みました (In the afternoon, I read a book).",
        options: [
          { text: "Played soccer", isCorrect: false },
          { text: "Read a book", isCorrect: true },
          { text: "Went shopping", isCorrect: false },
          { text: "Watched a movie", isCorrect: false },
        ],
      },
    ],
  },
  {
    slug: "at-the-cafe",
    title: "At the Café",
    subtitle: "カフェで",
    description: "Ordering drinks at a small café.",
    jlptLevel: "N5",
    difficulty: 1,
    estimatedMinutes: 3,
    order: 2,
    published: true,
    passage: `私はカフェに行きました。
店員さんに「コーヒーをください」と言いました。
コーヒーは三百円でした。
甘いケーキも食べました。
とてもおいしかったです。
カフェは駅の近くにあります。`,
    questions: [
      {
        question: "What did the writer order?",
        explanation: "They said コーヒーをください (Coffee, please).",
        options: [
          { text: "Tea", isCorrect: false },
          { text: "Coffee", isCorrect: true },
          { text: "Juice", isCorrect: false },
          { text: "Water", isCorrect: false },
        ],
      },
      {
        question: "How much was the coffee?",
        explanation: "The passage states 三百円 (300 yen).",
        options: [
          { text: "200 yen", isCorrect: false },
          { text: "300 yen", isCorrect: true },
          { text: "400 yen", isCorrect: false },
          { text: "500 yen", isCorrect: false },
        ],
      },
      {
        question: "What else did the writer eat?",
        explanation: "They also ate a sweet cake (甘いケーキ).",
        options: [
          { text: "Rice", isCorrect: false },
          { text: "Bread", isCorrect: false },
          { text: "Cake", isCorrect: true },
          { text: "Salad", isCorrect: false },
        ],
      },
      {
        question: "Where is the café located?",
        explanation: "The café is near the station (駅の近く).",
        options: [
          { text: "Near the station", isCorrect: true },
          { text: "Near the school", isCorrect: false },
          { text: "Near the park", isCorrect: false },
          { text: "Near the hospital", isCorrect: false },
        ],
      },
    ],
  },
  {
    slug: "my-family",
    title: "My Family",
    subtitle: "私の家族",
    description: "Introducing family members.",
    jlptLevel: "N5",
    difficulty: 1,
    estimatedMinutes: 3,
    order: 3,
    published: true,
    passage: `私の家族は四人です。
父と母と妹がいます。
父は会社員です。
母は先生です。
妹は高校生です。
私は大学生です。
日曜日に家族で映画を見ます。`,
    questions: [
      {
        question: "How many people are in the writer's family?",
        explanation: "The first line says 四人 (four people).",
        options: [
          { text: "Three", isCorrect: false },
          { text: "Four", isCorrect: true },
          { text: "Five", isCorrect: false },
          { text: "Six", isCorrect: false },
        ],
      },
      {
        question: "What is the father's job?",
        explanation: "父は会社員です means the father is a company employee.",
        options: [
          { text: "Teacher", isCorrect: false },
          { text: "Doctor", isCorrect: false },
          { text: "Company employee", isCorrect: true },
          { text: "Student", isCorrect: false },
        ],
      },
      {
        question: "What is the younger sister?",
        explanation: "妹は高校生です — the younger sister is a high school student.",
        options: [
          { text: "A university student", isCorrect: false },
          { text: "A high school student", isCorrect: true },
          { text: "An elementary student", isCorrect: false },
          { text: "A teacher", isCorrect: false },
        ],
      },
      {
        question: "What does the family do on Sundays?",
        explanation: "日曜日に家族で映画を見ます — they watch a movie together on Sunday.",
        options: [
          { text: "Go shopping", isCorrect: false },
          { text: "Watch a movie", isCorrect: true },
          { text: "Play sports", isCorrect: false },
          { text: "Travel", isCorrect: false },
        ],
      },
    ],
  },
  {
    slug: "going-to-school",
    title: "Going to School",
    subtitle: "学校へ行く",
    description: "A morning commute to school.",
    jlptLevel: "N5",
    difficulty: 1,
    estimatedMinutes: 4,
    order: 4,
    published: true,
    passage: `毎朝六時半に起きます。
七時に朝ごはんを食べます。
七時半に家を出ます。
バスで学校へ行きます。
学校は家から二十分です。
八時半から授業が始まります。
私は日本語のクラスが好きです。`,
    questions: [
      {
        question: "What time does the writer wake up every morning?",
        explanation: "毎朝六時半に起きます — wakes up at 6:30 every morning.",
        options: [
          { text: "6:00", isCorrect: false },
          { text: "6:30", isCorrect: true },
          { text: "7:00", isCorrect: false },
          { text: "7:30", isCorrect: false },
        ],
      },
      {
        question: "How does the writer go to school?",
        explanation: "They go by bus (バスで学校へ行きます).",
        options: [
          { text: "By train", isCorrect: false },
          { text: "By bus", isCorrect: true },
          { text: "By bicycle", isCorrect: false },
          { text: "On foot", isCorrect: false },
        ],
      },
      {
        question: "How long does it take from home to school?",
        explanation: "学校は家から二十分 — twenty minutes from home.",
        options: [
          { text: "Ten minutes", isCorrect: false },
          { text: "Fifteen minutes", isCorrect: false },
          { text: "Twenty minutes", isCorrect: true },
          { text: "Thirty minutes", isCorrect: false },
        ],
      },
      {
        question: "Which class does the writer like?",
        explanation: "私は日本語のクラスが好きです — likes Japanese class.",
        options: [
          { text: "Math", isCorrect: false },
          { text: "English", isCorrect: false },
          { text: "Japanese", isCorrect: true },
          { text: "Science", isCorrect: false },
        ],
      },
      {
        question: "When do classes start?",
        explanation: "八時半から授業が始まります — classes start at 8:30.",
        options: [
          { text: "8:00", isCorrect: false },
          { text: "8:30", isCorrect: true },
          { text: "9:00", isCorrect: false },
          { text: "9:30", isCorrect: false },
        ],
      },
    ],
  },
  {
    slug: "draft-n5-reading",
    title: "Draft Reading (Unpublished)",
    jlptLevel: "N5",
    difficulty: 1,
    estimatedMinutes: 3,
    order: 99,
    published: false,
    passage: "これは下書きです。",
    questions: [
      {
        question: "Is this published?",
        options: [
          { text: "Yes", isCorrect: false },
          { text: "No", isCorrect: true },
        ],
      },
    ],
  },
];

export const N4_READINGS: ReadingSeed[] = [
  {
    slug: "weekend-in-kyoto",
    title: "Weekend in Kyoto",
    subtitle: "京都の週末",
    description: "A short travel diary for N4 learners.",
    jlptLevel: "N4",
    difficulty: 2,
    estimatedMinutes: 5,
    order: 1,
    published: true,
    passage: `先週末、友だちと京都へ旅行に行きました。
土曜日の朝、新幹線で京都駅に着きました。
まず清水寺を見学しました。人が多かったですが、とてもきれいでした。
昼ごはんは近くのレストランでうどんを食べました。
午後は伏見稲荷大社へ行き、たくさん写真を撮りました。
日曜日は奈良へ行って、鹿と遊びました。
二日間とても楽しかったです。`,
    questions: [
      {
        question: "How did they travel to Kyoto?",
        explanation: "They arrived at Kyoto Station by shinkansen (新幹線).",
        options: [
          { text: "By bus", isCorrect: false },
          { text: "By shinkansen", isCorrect: true },
          { text: "By airplane", isCorrect: false },
          { text: "By car", isCorrect: false },
        ],
      },
      {
        question: "What temple did they visit first?",
        explanation: "They first visited Kiyomizu-dera (清水寺).",
        options: [
          { text: "Kiyomizu-dera", isCorrect: true },
          { text: "Fushimi Inari", isCorrect: false },
          { text: "Kinkaku-ji", isCorrect: false },
          { text: "Todai-ji", isCorrect: false },
        ],
      },
      {
        question: "What did they eat for lunch?",
        explanation: "They ate udon at a nearby restaurant (うどんを食べました).",
        options: [
          { text: "Ramen", isCorrect: false },
          { text: "Udon", isCorrect: true },
          { text: "Sushi", isCorrect: false },
          { text: "Curry", isCorrect: false },
        ],
      },
      {
        question: "Where did they go on Sunday?",
        explanation: "On Sunday they went to Nara (奈良へ行って).",
        options: [
          { text: "Osaka", isCorrect: false },
          { text: "Tokyo", isCorrect: false },
          { text: "Nara", isCorrect: true },
          { text: "Hiroshima", isCorrect: false },
        ],
      },
    ],
  },
  {
    slug: "part-time-job",
    title: "My Part-Time Job",
    subtitle: "アルバイト",
    description: "Working at a convenience store.",
    jlptLevel: "N4",
    difficulty: 2,
    estimatedMinutes: 5,
    order: 2,
    published: true,
    passage: `私はコンビニでアルバイトをしています。
週に三回、夕方五時から九時まで働きます。
最初はレジの使い方が難しかったです。
今はもっと慣れました。
お客さんに「いらっしゃいませ」と言うのが大切です。
忙しい日もありますが、同僚が優しいので楽しいです。
給料は月に八万円くらいもらいます。`,
    questions: [
      {
        question: "Where does the writer work?",
        explanation: "They work at a convenience store (コンビニ).",
        options: [
          { text: "A restaurant", isCorrect: false },
          { text: "A convenience store", isCorrect: true },
          { text: "A bookstore", isCorrect: false },
          { text: "A hotel", isCorrect: false },
        ],
      },
      {
        question: "How many days a week do they work?",
        explanation: "週に三回 — three times a week.",
        options: [
          { text: "Two days", isCorrect: false },
          { text: "Three days", isCorrect: true },
          { text: "Four days", isCorrect: false },
          { text: "Five days", isCorrect: false },
        ],
      },
      {
        question: "What was difficult at first?",
        explanation: "Using the register was difficult at first (レジの使い方).",
        options: [
          { text: "Cleaning", isCorrect: false },
          { text: "Using the register", isCorrect: true },
          { text: "Cooking", isCorrect: false },
          { text: "Stocking shelves", isCorrect: false },
        ],
      },
      {
        question: "About how much salary do they receive per month?",
        explanation: "給料は月に八万円くらい — about 80,000 yen per month.",
        options: [
          { text: "50,000 yen", isCorrect: false },
          { text: "60,000 yen", isCorrect: false },
          { text: "80,000 yen", isCorrect: true },
          { text: "100,000 yen", isCorrect: false },
        ],
      },
    ],
  },
];

export const ALL_READINGS: ReadingSeed[] = [...N5_READINGS, ...N4_READINGS];
