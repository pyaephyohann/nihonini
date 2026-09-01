import type { JapaneseLevel } from "../../src/generated/prisma/client";

export type ListeningOptionSeed = {
  text: string;
  isCorrect: boolean;
};

export type ListeningQuestionSeed = {
  question: string;
  explanation?: string;
  options: ListeningOptionSeed[];
};

export type ListeningSeed = {
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  transcript: string;
  jlptLevel: JapaneseLevel;
  difficulty: number;
  estimatedMinutes: number;
  durationSeconds: number;
  order: number;
  published: boolean;
  questions: ListeningQuestionSeed[];
};

export const N5_LISTENINGS: ListeningSeed[] = [
  {
    slug: "at-the-station",
    title: "At the Station",
    subtitle: "駅で",
    description: "Buying a train ticket at the station.",
    jlptLevel: "N5",
    difficulty: 1,
    estimatedMinutes: 2,
    durationSeconds: 45,
    order: 1,
    published: true,
    transcript:
      "駅員：いらっしゃいませ。\n男：すみません。京都行きの切符をください。\n駅員：何時の電車ですか。\n男：八時半の電車です。\n駅員：はい、五百六十円です。\n男：ありがとうございます。",
    questions: [
      {
        question: "What does the man want to buy?",
        explanation: "The man asks for a ticket to Kyoto (京都行きの切符).",
        options: [
          { text: "A bus ticket", isCorrect: false },
          { text: "A train ticket to Kyoto", isCorrect: true },
          { text: "A map", isCorrect: false },
          { text: "A lunch box", isCorrect: false },
        ],
      },
      {
        question: "What time is the train?",
        explanation: "He says 八時半 (8:30).",
        options: [
          { text: "8:00", isCorrect: false },
          { text: "8:30", isCorrect: true },
          { text: "9:00", isCorrect: false },
          { text: "9:30", isCorrect: false },
        ],
      },
      {
        question: "How much is the ticket?",
        explanation: "The clerk says 五百六十円 (560 yen).",
        options: [
          { text: "460 yen", isCorrect: false },
          { text: "560 yen", isCorrect: true },
          { text: "650 yen", isCorrect: false },
          { text: "860 yen", isCorrect: false },
        ],
      },
    ],
  },
  {
    slug: "ordering-food",
    title: "Ordering Food",
    subtitle: "レストランで",
    jlptLevel: "N5",
    difficulty: 1,
    estimatedMinutes: 2,
    durationSeconds: 40,
    order: 2,
    published: true,
    transcript:
      "店員：いらっしゃいませ。何名様ですか。\n女：一人です。\n店員：こちらへどうぞ。ご注文はお決まりですか。\n女：ラーメンを一つください。お茶もください。\n店員：かしこまりました。",
    questions: [
      {
        question: "How many people are dining?",
        explanation: "She says 一人です (One person).",
        options: [
          { text: "One", isCorrect: true },
          { text: "Two", isCorrect: false },
          { text: "Three", isCorrect: false },
          { text: "Four", isCorrect: false },
        ],
      },
      {
        question: "What does the woman order?",
        explanation: "She orders ramen (ラーメンを一つ).",
        options: [
          { text: "Curry", isCorrect: false },
          { text: "Ramen", isCorrect: true },
          { text: "Sushi", isCorrect: false },
          { text: "Udon", isCorrect: false },
        ],
      },
      {
        question: "What else does she order?",
        explanation: "She also asks for tea (お茶もください).",
        options: [
          { text: "Water", isCorrect: false },
          { text: "Tea", isCorrect: true },
          { text: "Coffee", isCorrect: false },
          { text: "Juice", isCorrect: false },
        ],
      },
    ],
  },
  {
    slug: "weather-today",
    title: "Today's Weather",
    subtitle: "今日の天気",
    jlptLevel: "N5",
    difficulty: 1,
    estimatedMinutes: 2,
    durationSeconds: 35,
    order: 3,
    published: true,
    transcript:
      "アナウンサー：今日の天気予報です。午前中は晴れです。午後から雨が降ります。気温は二十五度です。傘を持っていきましょう。",
    questions: [
      {
        question: "What is the weather in the morning?",
        explanation: "午前中は晴れ (sunny in the morning).",
        options: [
          { text: "Rainy", isCorrect: false },
          { text: "Sunny", isCorrect: true },
          { text: "Cloudy", isCorrect: false },
          { text: "Snowy", isCorrect: false },
        ],
      },
      {
        question: "What happens in the afternoon?",
        explanation: "午後から雨が降ります (it will rain from the afternoon).",
        options: [
          { text: "It gets sunny", isCorrect: false },
          { text: "It will rain", isCorrect: true },
          { text: "It will snow", isCorrect: false },
          { text: "It gets windy", isCorrect: false },
        ],
      },
      {
        question: "What is the temperature?",
        explanation: "気温は二十五度 (25 degrees).",
        options: [
          { text: "15°C", isCorrect: false },
          { text: "20°C", isCorrect: false },
          { text: "25°C", isCorrect: true },
          { text: "30°C", isCorrect: false },
        ],
      },
      {
        question: "What does the announcer recommend?",
        explanation: "傘を持っていきましょう (let's bring an umbrella).",
        options: [
          { text: "Bring a coat", isCorrect: false },
          { text: "Bring an umbrella", isCorrect: true },
          { text: "Stay home", isCorrect: false },
          { text: "Wear a hat", isCorrect: false },
        ],
      },
    ],
  },
  {
    slug: "meeting-a-friend",
    title: "Meeting a Friend",
    subtitle: "友だちと会う",
    jlptLevel: "N5",
    difficulty: 1,
    estimatedMinutes: 2,
    durationSeconds: 42,
    order: 4,
    published: true,
    transcript:
      "男：もしもし、田中です。\n女：あ、田中さん。今どこですか。\n男：駅の前にいます。\n女：分かりました。五分後に行きます。\n男：じゃ、待っています。",
    questions: [
      {
        question: "Where is the man now?",
        explanation: "He says 駅の前にいます (I'm in front of the station).",
        options: [
          { text: "At home", isCorrect: false },
          { text: "In front of the station", isCorrect: true },
          { text: "At school", isCorrect: false },
          { text: "At a café", isCorrect: false },
        ],
      },
      {
        question: "When will the woman arrive?",
        explanation: "五分後に行きます (I'll go in five minutes).",
        options: [
          { text: "Immediately", isCorrect: false },
          { text: "In five minutes", isCorrect: true },
          { text: "In thirty minutes", isCorrect: false },
          { text: "Tomorrow", isCorrect: false },
        ],
      },
    ],
  },
  {
    slug: "draft-n5-listening",
    title: "Draft Listening",
    jlptLevel: "N5",
    difficulty: 1,
    estimatedMinutes: 1,
    durationSeconds: 10,
    order: 99,
    published: false,
    transcript: "これは下書きです。",
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

export const N4_LISTENINGS: ListeningSeed[] = [
  {
    slug: "job-interview",
    title: "Job Interview",
    subtitle: "面接",
    jlptLevel: "N4",
    difficulty: 2,
    estimatedMinutes: 3,
    durationSeconds: 55,
    order: 1,
    published: true,
    transcript:
      "面接官：自己紹介をお願いします。\n応募者：はい。私は大学を去年卒業しました。前の会社で二年間働きました。日本語を勉強するために日本に来ました。\n面接官：ありがとうございます。",
    questions: [
      {
        question: "When did the applicant graduate from university?",
        explanation: "去年卒業しました (graduated last year).",
        options: [
          { text: "This year", isCorrect: false },
          { text: "Last year", isCorrect: true },
          { text: "Two years ago", isCorrect: false },
          { text: "Three years ago", isCorrect: false },
        ],
      },
      {
        question: "How long did they work at their previous company?",
        explanation: "二年間働きました (worked for two years).",
        options: [
          { text: "One year", isCorrect: false },
          { text: "Two years", isCorrect: true },
          { text: "Three years", isCorrect: false },
          { text: "Four years", isCorrect: false },
        ],
      },
      {
        question: "Why did they come to Japan?",
        explanation: "日本語を勉強するために (to study Japanese).",
        options: [
          { text: "For travel", isCorrect: false },
          { text: "To study Japanese", isCorrect: true },
          { text: "For work only", isCorrect: false },
          { text: "To visit family", isCorrect: false },
        ],
      },
    ],
  },
  {
    slug: "doctor-visit",
    title: "At the Doctor",
    subtitle: "病院で",
    jlptLevel: "N4",
    difficulty: 2,
    estimatedMinutes: 3,
    durationSeconds: 50,
    order: 2,
    published: true,
    transcript:
      "医者：どうしましたか。\n患者：昨日から頭が痛くて、熱もあります。\n医者：風邪ですね。薬を出します。三日間休んでください。\n患者：分かりました。ありがとうございます。",
    questions: [
      {
        question: "When did the symptoms start?",
        explanation: "昨日から (since yesterday).",
        options: [
          { text: "Today", isCorrect: false },
          { text: "Yesterday", isCorrect: true },
          { text: "Last week", isCorrect: false },
          { text: "A month ago", isCorrect: false },
        ],
      },
      {
        question: "What is the diagnosis?",
        explanation: "風邪ですね (it's a cold).",
        options: [
          { text: "A cold", isCorrect: true },
          { text: "A broken bone", isCorrect: false },
          { text: "An allergy", isCorrect: false },
          { text: "Food poisoning", isCorrect: false },
        ],
      },
      {
        question: "How long should the patient rest?",
        explanation: "三日間休んでください (rest for three days).",
        options: [
          { text: "One day", isCorrect: false },
          { text: "Two days", isCorrect: false },
          { text: "Three days", isCorrect: true },
          { text: "One week", isCorrect: false },
        ],
      },
    ],
  },
];

export const ALL_LISTENINGS: ListeningSeed[] = [...N5_LISTENINGS, ...N4_LISTENINGS];
