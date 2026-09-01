import type { LegacyTutorResponseInput, TutorResponseInput } from "@/lib/validations/tutor";

/** Strip internal practice fields before sending to the client or persisting. */
export function toClientSafeTutorResponse(
  response: TutorResponseInput | LegacyTutorResponseInput,
): TutorResponseInput | LegacyTutorResponseInput {
  if (response.type !== "PRACTICE") {
    return response;
  }

  const { expectedAnswer: _removed, ...practice } = response.practice;
  void _removed;
  return {
    ...response,
    practice,
  };
}

/** Returns true if the serialized response contains an exposed practice answer key. */
export function hasExposedPracticeAnswerKey(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  if (record.type !== "PRACTICE") {
    return false;
  }

  const practice = record.practice;
  if (!practice || typeof practice !== "object") {
    return false;
  }

  return "expectedAnswer" in practice && (practice as { expectedAnswer?: string }).expectedAnswer !== undefined;
}
