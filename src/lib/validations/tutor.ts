import { z } from "zod";

export const tutorResponseTypeValues = [
  "EXPLANATION",
  "TRANSLATION",
  "CORRECTION",
  "COMPARISON",
  "EXAMPLE",
  "PRACTICE",
  "STUDY_SUGGESTION",
  "CLARIFICATION",
  "REFUSAL",
] as const;

export const tutorSuggestedActionTypeValues = [
  "PRACTICE_WEAK_VOCABULARY",
  "PRACTICE_WEAK_GRAMMAR",
  "PRACTICE_WEAK_KANJI",
  "CONTINUE_LEARNING",
  "OPEN_READING",
  "OPEN_LISTENING",
  "OPEN_PRACTICE",
  "OPEN_LESSON",
  "OPEN_VOCABULARY",
  "OPEN_GRAMMAR",
  "OPEN_KANJI",
  "PRACTICE_WEAK_SKILL",
  "VIEW_PROGRESS",
] as const;

export const tutorMistakeCategoryValues = [
  "GRAMMAR",
  "PARTICLE",
  "TENSE",
  "WORD_ORDER",
  "VOCABULARY",
  "KANJI",
  "SPELLING",
  "POLITENESS",
  "NATURALNESS",
] as const;

export const tutorPracticeQuestionTypeValues = [
  "MULTIPLE_CHOICE",
  "FILL_BLANK",
  "TRANSLATION",
  "CORRECTION",
  "FREE_RESPONSE",
] as const;

export type TutorResponseType = (typeof tutorResponseTypeValues)[number];
export type TutorSuggestedActionType = (typeof tutorSuggestedActionTypeValues)[number];
export type TutorMistakeCategory = (typeof tutorMistakeCategoryValues)[number];
export type TutorPracticeQuestionType = (typeof tutorPracticeQuestionTypeValues)[number];

const MAX_MESSAGE_CHARS = 2000;
const MAX_ANSWER_CHARS = 4000;
const MAX_EXPLANATION_CHARS = 2000;
const MAX_SHORT_TEXT = 500;
const MAX_PRACTICE_QUESTION = 2000;

export const tutorRequestSchema = z
  .object({
    conversationId: z.string().min(1).optional(),
    message: z
      .string()
      .trim()
      .min(1, "Please enter a message.")
      .max(MAX_MESSAGE_CHARS, "Your message is too long. Please shorten it and try again."),
  })
  .strict();

export type TutorRequestInput = z.infer<typeof tutorRequestSchema>;

const exampleSchema = z.object({
  japanese: z.string().min(1).max(MAX_SHORT_TEXT),
  reading: z.string().max(MAX_SHORT_TEXT).optional(),
  meaning: z.string().min(1).max(MAX_SHORT_TEXT),
});

const suggestedActionSchema = z
  .object({
    type: z.enum(tutorSuggestedActionTypeValues),
    label: z.string().min(1).max(100),
  })
  .strict();

const relatedContentSchema = z
  .array(
    z
      .object({
        kind: z.enum(["VOCABULARY", "GRAMMAR", "KANJI", "LESSON"]),
        id: z.string().min(1).max(100),
        title: z.string().min(1).max(200),
      })
      .strict(),
  )
  .max(5);

const explanationResponseSchema = z
  .object({
    type: z.literal("EXPLANATION"),
    answer: z.string().min(1).max(MAX_ANSWER_CHARS),
    explanation: z.string().max(MAX_EXPLANATION_CHARS).optional(),
    examples: z.array(exampleSchema).max(3).optional(),
    relatedContent: relatedContentSchema.optional(),
    suggestedAction: suggestedActionSchema.optional(),
  })
  .strict();

const translationResponseSchema = z
  .object({
    type: z.literal("TRANSLATION"),
    answer: z.string().min(1).max(MAX_ANSWER_CHARS),
    translation: z.string().min(1).max(MAX_ANSWER_CHARS),
    explanation: z.string().max(MAX_EXPLANATION_CHARS).optional(),
    examples: z.array(exampleSchema).max(3).optional(),
  })
  .strict();

const correctionResponseSchema = z
  .object({
    type: z.literal("CORRECTION"),
    answer: z.string().min(1).max(MAX_ANSWER_CHARS),
    correction: z
      .object({
        original: z.string().min(1).max(MAX_SHORT_TEXT),
        corrected: z.string().min(1).max(MAX_SHORT_TEXT),
        mistakes: z
          .array(
            z
              .object({
                category: z.enum(tutorMistakeCategoryValues),
                original: z.string().min(1).max(MAX_SHORT_TEXT),
                correction: z.string().min(1).max(MAX_SHORT_TEXT),
                explanation: z.string().min(1).max(MAX_SHORT_TEXT),
              })
              .strict(),
          )
          .max(5),
        overallExplanation: z.string().min(1).max(MAX_EXPLANATION_CHARS),
      })
      .strict(),
    examples: z.array(exampleSchema).max(3).optional(),
  })
  .strict();

const comparisonResponseSchema = z
  .object({
    type: z.literal("COMPARISON"),
    answer: z.string().min(1).max(MAX_ANSWER_CHARS),
    comparison: z
      .object({
        itemA: z.string().min(1).max(200),
        itemB: z.string().min(1).max(200),
        differences: z
          .array(
            z
              .object({
                aspect: z.string().min(1).max(200),
                itemA: z.string().min(1).max(MAX_SHORT_TEXT),
                itemB: z.string().min(1).max(MAX_SHORT_TEXT),
              })
              .strict(),
          )
          .max(5),
      })
      .strict(),
  })
  .strict();

const exampleResponseSchema = z
  .object({
    type: z.literal("EXAMPLE"),
    answer: z.string().min(1).max(MAX_ANSWER_CHARS),
    explanation: z.string().max(MAX_EXPLANATION_CHARS).optional(),
    examples: z.array(exampleSchema).min(1).max(3),
    relatedContent: relatedContentSchema.optional(),
    suggestedAction: suggestedActionSchema.optional(),
  })
  .strict();

const practiceResponseSchema = z
  .object({
    type: z.literal("PRACTICE"),
    answer: z.string().min(1).max(MAX_ANSWER_CHARS),
    practice: z
      .object({
        question: z.string().min(1).max(MAX_PRACTICE_QUESTION),
        questionType: z.enum(tutorPracticeQuestionTypeValues),
        choices: z.array(z.string().min(1).max(200)).max(6).optional(),
        hint: z.string().max(MAX_SHORT_TEXT).optional(),
        explanation: z.string().max(MAX_EXPLANATION_CHARS).optional(),
        expectedAnswer: z.string().max(MAX_SHORT_TEXT).optional(),
      })
      .strict(),
  })
  .strict();

const studySuggestionResponseSchema = z
  .object({
    type: z.literal("STUDY_SUGGESTION"),
    answer: z.string().min(1).max(MAX_ANSWER_CHARS),
    explanation: z.string().max(MAX_EXPLANATION_CHARS).optional(),
    suggestedAction: suggestedActionSchema,
    relatedContent: relatedContentSchema.optional(),
  })
  .strict();

const clarificationResponseSchema = z
  .object({
    type: z.literal("CLARIFICATION"),
    answer: z.string().min(1).max(MAX_ANSWER_CHARS),
  })
  .strict();

const refusalResponseSchema = z
  .object({
    type: z.literal("REFUSAL"),
    answer: z.string().min(1).max(MAX_ANSWER_CHARS),
  })
  .strict();

export const tutorResponseSchema = z.discriminatedUnion("type", [
  explanationResponseSchema,
  translationResponseSchema,
  correctionResponseSchema,
  comparisonResponseSchema,
  exampleResponseSchema,
  practiceResponseSchema,
  studySuggestionResponseSchema,
  clarificationResponseSchema,
  refusalResponseSchema,
]);

export type TutorResponseInput = z.infer<typeof tutorResponseSchema>;

/** M9.1/M9.2 legacy flat response shape — kept for backward-compatible parsing. */
export const legacyTutorResponseSchema = z
  .object({
    type: z.enum([
      "EXPLANATION",
      "CORRECTION",
      "EXAMPLE",
      "STUDY_SUGGESTION",
      "CLARIFICATION",
      "REFUSAL",
    ]),
    answer: z.string().min(1).max(MAX_ANSWER_CHARS),
    explanation: z.string().max(MAX_EXPLANATION_CHARS).optional(),
    examples: z.array(exampleSchema).max(3).optional(),
    corrections: z
      .array(
        z
          .object({
            original: z.string().min(1).max(MAX_SHORT_TEXT),
            corrected: z.string().min(1).max(MAX_SHORT_TEXT),
            note: z.string().min(1).max(MAX_SHORT_TEXT),
          })
          .strict(),
      )
      .max(3)
      .optional(),
    relatedContent: relatedContentSchema.optional(),
    suggestedAction: suggestedActionSchema.optional(),
  })
  .strict();

export type LegacyTutorResponseInput = z.infer<typeof legacyTutorResponseSchema>;

export const TUTOR_MAX_MESSAGE_CHARS = MAX_MESSAGE_CHARS;
