"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { TutorResponseContent } from "@/components/tutor/tutor-response-content";
import type { TutorMessageDto } from "@/types/tutor";

type TutorMessageListProps = {
  messages: TutorMessageDto[];
  isPending?: boolean;
};

export function TutorMessageList({ messages, isPending = false }: TutorMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isPending]);

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="flex-1 space-y-4 overflow-y-auto px-1 py-4"
    >
      {messages.map((message) => {
        const isUser = message.role === "USER";
        return (
          <div
            key={message.id}
            className={cn("flex", isUser ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-4 py-3 text-sm shadow-sm sm:max-w-[75%]",
                isUser
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground",
              )}
            >
              <p
                className={cn(
                  "whitespace-pre-wrap",
                  isUser ? "text-primary-foreground" : "font-japanese text-foreground",
                )}
              >
                {message.content}
              </p>
              {!isUser && message.response && (
                <TutorResponseContent response={message.response} />
              )}
            </div>
          </div>
        );
      })}
      {isPending && (
        <div className="flex justify-start">
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Thinking...
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
