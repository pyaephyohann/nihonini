import "server-only";

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return raw === "true" || raw === "1";
}

export const tutorConfig = {
  get enabled() {
    return readBool("TUTOR_ENABLED", false);
  },
  get apiKey() {
    return process.env.TUTOR_AI_API_KEY ?? "";
  },
  get model() {
    return process.env.TUTOR_AI_MODEL ?? "gpt-4o-mini";
  },
  get baseUrl() {
    return (process.env.TUTOR_AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  },
  get maxOutputTokens() {
    return readInt("TUTOR_AI_MAX_OUTPUT_TOKENS", 1024);
  },
  get timeoutMs() {
    return readInt("TUTOR_AI_TIMEOUT_MS", 30_000);
  },
  get maxInputChars() {
    return readInt("TUTOR_AI_MAX_INPUT_CHARS", 2000);
  },
};

export function isTutorProviderConfigured(): boolean {
  return tutorConfig.enabled && tutorConfig.apiKey.length > 0;
}
