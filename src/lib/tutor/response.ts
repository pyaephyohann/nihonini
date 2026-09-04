import type { LegacyTutorResponseInput, TutorResponseInput } from "@/lib/validations/tutor";
import type { TutorAdaptiveCoachingContext } from "@/server/tutor/coaching/tutor-coaching.types";
import type { TutorOutcomeContext } from "@/server/tutor/outcome/tutor-outcome.types";

type TutorPayloadWithMetadata = (TutorResponseInput | LegacyTutorResponseInput) & {
  adaptiveCoachingContext?: TutorAdaptiveCoachingContext;
  outcomeContext?: TutorOutcomeContext;
};

/** Strip internal practice fields, policy metadata, and database IDs before sending to the client. */
export function toClientSafeTutorResponse(
  response: TutorResponseInput | LegacyTutorResponseInput,
): TutorResponseInput | LegacyTutorResponseInput {
  const safe = { ...response } as TutorPayloadWithMetadata;

  // Strip internal prompt metadata from coaching context
  if (safe.adaptiveCoachingContext) {
    const { recommendedBehavior: _omitted, ...safeCoaching } = safe.adaptiveCoachingContext;
    void _omitted;
    safe.adaptiveCoachingContext = safeCoaching as TutorAdaptiveCoachingContext;
  }

  // Strip internal database IDs from outcome context
  if (safe.outcomeContext) {
    const safeOutcomeContext = { ...safe.outcomeContext };
    
    if (safeOutcomeContext.recommendation) {
      const { messageId: _msgId, contentId: _cId1, ...safeRec } = safeOutcomeContext.recommendation;
      void _msgId;
      void _cId1;
      safeOutcomeContext.recommendation = safeRec as typeof safeOutcomeContext.recommendation;
    }
    
    if (safeOutcomeContext.outcome) {
      const { contentId: _cId2, ...safeOut } = safeOutcomeContext.outcome;
      void _cId2;
      safeOutcomeContext.outcome = safeOut as typeof safeOutcomeContext.outcome;
    }
    
    safe.outcomeContext = safeOutcomeContext;
  }

  if (safe.type !== "PRACTICE") {
    return safe as TutorResponseInput | LegacyTutorResponseInput;
  }

  const { expectedAnswer: _removed, ...practice } = safe.practice;
  void _removed;
  return {
    ...safe,
    practice,
  } as TutorResponseInput | LegacyTutorResponseInput;
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

  return (
    "expectedAnswer" in practice &&
    (practice as { expectedAnswer?: string }).expectedAnswer !== undefined
  );
}
