"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TUTOR_MAX_MESSAGE_CHARS } from "@/lib/validations/tutor";

type TutorComposerProps = {
  disabled?: boolean;
  isPending?: boolean;
  onSend: (message: string) => void;
};

export function TutorComposer({
  disabled = false,
  isPending = false,
  onSend,
}: TutorComposerProps) {
  const [message, setMessage] = useState("");

  const trimmed = message.trim();
  const canSend = trimmed.length > 0 && !disabled && !isPending;

  const handleSend = () => {
    if (!canSend) {
      return;
    }
    onSend(trimmed);
    setMessage("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-background p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="tutor-message" className="sr-only">
            Ask your Japanese tutor
          </label>
          <Textarea
            id="tutor-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your Japanese tutor..."
            rows={2}
            maxLength={TUTOR_MAX_MESSAGE_CHARS}
            disabled={disabled || isPending}
            className="min-h-[52px] resize-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {message.length}/{TUTOR_MAX_MESSAGE_CHARS} · Enter to send, Shift+Enter for newline
          </p>
        </div>
        <Button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className="shrink-0"
        >
          <SendHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
