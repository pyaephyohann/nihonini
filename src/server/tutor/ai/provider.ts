import "server-only";

export type TutorAiMessage = {
  role: "user" | "assistant";
  content: string;
};

export type TutorAiCompletionInput = {
  system: string;
  messages: TutorAiMessage[];
  maxOutputTokens: number;
  timeoutMs: number;
};

export type TutorAiCompletionResult = {
  text: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
};

export interface TutorAiProvider {
  complete(input: TutorAiCompletionInput): Promise<TutorAiCompletionResult>;
}
