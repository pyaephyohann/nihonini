import "server-only";

import { tutorConfig } from "@/server/tutor/tutor-config";
import type {
  TutorAiCompletionInput,
  TutorAiCompletionResult,
  TutorAiProvider,
} from "@/server/tutor/ai/provider";

type ChatCompletionResponse = {
  model?: string;
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  error?: { message?: string };
};

export class OpenAiCompatibleProvider implements TutorAiProvider {
  async complete(input: TutorAiCompletionInput): Promise<TutorAiCompletionResult> {
    if (!tutorConfig.apiKey) {
      throw new Error("TUTOR_PROVIDER_NOT_CONFIGURED");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs);

    try {
      const response = await fetch(`${tutorConfig.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tutorConfig.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: tutorConfig.model,
          max_tokens: input.maxOutputTokens,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: input.system },
            ...input.messages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("TUTOR_PROVIDER_HTTP_ERROR");
      }

      const data = (await response.json()) as ChatCompletionResponse;
      const text = data.choices?.[0]?.message?.content?.trim();

      if (!text) {
        throw new Error("TUTOR_PROVIDER_EMPTY_RESPONSE");
      }

      return {
        text,
        model: data.model ?? tutorConfig.model,
        usage:
          data.usage?.prompt_tokens !== undefined &&
          data.usage?.completion_tokens !== undefined
            ? {
                inputTokens: data.usage.prompt_tokens,
                outputTokens: data.usage.completion_tokens,
              }
            : undefined,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("TUTOR_PROVIDER_TIMEOUT");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

let defaultProvider: TutorAiProvider | null = null;

export function getTutorAiProvider(): TutorAiProvider {
  if (!defaultProvider) {
    defaultProvider = new OpenAiCompatibleProvider();
  }
  return defaultProvider;
}

export function setTutorAiProviderForTests(provider: TutorAiProvider | null) {
  defaultProvider = provider;
}
