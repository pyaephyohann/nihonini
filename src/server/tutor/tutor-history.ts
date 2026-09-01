import "server-only";

import {
  MAX_HISTORY_CHARS,
  MAX_HISTORY_TURNS,
} from "@/server/tutor/tutor.constants";

export type TutorPromptHistoryTurn = {
  role: "user" | "assistant";
  content: string;
};

export function buildPromptHistory(
  messages: Array<{ role: "USER" | "ASSISTANT"; content: string }>,
): TutorPromptHistoryTurn[] {
  const converted = messages.map((message) => ({
    role: message.role === "USER" ? ("user" as const) : ("assistant" as const),
    content: message.content,
  }));

  const trimmedByTurns = converted.slice(-MAX_HISTORY_TURNS * 2);

  const selected: TutorPromptHistoryTurn[] = [];
  let charCount = 0;

  for (let index = trimmedByTurns.length - 1; index >= 0; index -= 1) {
    const turn = trimmedByTurns[index];

    if (charCount + turn.content.length > MAX_HISTORY_CHARS && selected.length > 0) {
      break;
    }

    if (charCount + turn.content.length > MAX_HISTORY_CHARS) {
      const remaining = MAX_HISTORY_CHARS - charCount;
      selected.unshift({
        role: turn.role,
        content: turn.content.slice(-remaining),
      });
      break;
    }

    selected.unshift(turn);
    charCount += turn.content.length;
  }

  return selected;
}
