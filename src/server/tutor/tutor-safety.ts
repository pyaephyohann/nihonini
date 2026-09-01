import "server-only";

import {
  legacyTutorResponseSchema,
  tutorResponseSchema,
  type LegacyTutorResponseInput,
  type TutorResponseInput,
} from "@/lib/validations/tutor";
import { toClientSafeTutorResponse } from "@/lib/tutor/response";
import type { TutorGroundedContent, TutorResponse } from "@/types/tutor";

const MAX_RAW_OUTPUT_CHARS = 12_000;

export function sanitizeTutorUserMessage(message: string): string {
  return message.replace(/\0/g, "").trim();
}

export function extractJsonFromModelText(text: string): unknown {
  const trimmed = text.trim().slice(0, MAX_RAW_OUTPUT_CHARS);

  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // continue
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // continue
    }
  }

  return null;
}

export function validateTutorResponsePayload(
  payload: unknown,
): TutorResponseInput | LegacyTutorResponseInput | null {
  const modern = tutorResponseSchema.safeParse(payload);
  if (modern.success) {
    return modern.data;
  }

  const legacy = legacyTutorResponseSchema.safeParse(payload);
  if (legacy.success) {
    return legacy.data;
  }

  return null;
}

function getRelatedContent(
  response: TutorResponseInput | LegacyTutorResponseInput,
): Array<{ kind: string; id: string; title: string }> | undefined {
  if ("relatedContent" in response && response.relatedContent) {
    return response.relatedContent;
  }
  return undefined;
}

export function filterRelatedContentToGrounding(
  response: TutorResponseInput | LegacyTutorResponseInput,
  grounding: TutorGroundedContent[],
): TutorResponseInput | LegacyTutorResponseInput {
  const relatedContent = getRelatedContent(response);
  if (!relatedContent || relatedContent.length === 0) {
    return response;
  }

  const allowed = new Set(grounding.map((item) => `${item.kind}:${item.id}`));
  const filtered = relatedContent.filter((item) =>
    allowed.has(`${item.kind}:${item.id}`),
  );

  if (filtered.length === relatedContent.length) {
    return response;
  }

  return {
    ...response,
    relatedContent: filtered.length > 0 ? filtered : undefined,
  } as TutorResponseInput | LegacyTutorResponseInput;
}

export function prepareTutorResponseForStorageAndClient(
  response: TutorResponseInput | LegacyTutorResponseInput,
): TutorResponse {
  return toClientSafeTutorResponse(response) as TutorResponse;
}

export function buildFallbackRefusalResponse(): TutorResponseInput {
  return {
    type: "REFUSAL",
    answer:
      "I couldn't produce a valid tutor response right now. Please rephrase your question and try again.",
  };
}

export const tutorUserFacingErrors = {
  disabled: "The tutor is currently disabled.",
  unavailable: "The tutor is temporarily unavailable. Please try again.",
  tooLong: "Your message is too long. Please shorten it and try again.",
  invalidInput: "Please enter a valid tutor message.",
  invalidResponse: "The tutor is temporarily unavailable. Please try again.",
} as const;
