"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { TutorComposer } from "@/components/tutor/tutor-composer";
import { TutorConversationList } from "@/components/tutor/tutor-conversation-list";
import { TutorEmptyState } from "@/components/tutor/tutor-empty-state";
import { TutorMessageList } from "@/components/tutor/tutor-message-list";
import { sendTutorMessageAction } from "@/server/tutor/tutor.actions";
import type { TutorConversationSummary, TutorMessageDto } from "@/types/tutor";

type TutorChatViewProps = {
  conversations: TutorConversationSummary[];
  conversationId?: string;
  initialMessages?: TutorMessageDto[];
  title?: string;
  tutorEnabled: boolean;
  showSidebar?: boolean;
};

export function TutorChatView({
  conversations,
  conversationId,
  initialMessages = [],
  title,
  tutorEnabled,
  showSidebar = true,
}: TutorChatViewProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSend = (message: string) => {
    if (!tutorEnabled) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await sendTutorMessageAction({
        conversationId,
        message,
      });

      if ("error" in result) {
        setError(result.error);
        if (result.conversationId && !conversationId) {
          router.push(`/app/tutor/${result.conversationId}`);
        } else {
          router.refresh();
        }
        return;
      }

      setMessages((current) => [...current, result.userMessage, result.assistantMessage]);

      if (!conversationId) {
        router.push(`/app/tutor/${result.conversationId}`);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col lg:flex-row">
      {showSidebar && (
        <aside className="border-b border-border bg-secondary/40 p-4 lg:w-80 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Conversations</h2>
            <Link href="/app/tutor">
              <Button size="sm" variant="secondary">
                New
              </Button>
            </Link>
          </div>
          <TutorConversationList
            conversations={conversations}
            activeConversationId={conversationId}
          />
        </aside>
      )}

      <section className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {title ?? "Nihonini Tutor"}
              </h1>
              {!tutorEnabled && (
                <p className="mt-1 text-sm text-muted-foreground">
                  The tutor is currently disabled.
                </p>
              )}
            </div>
            {conversationId && (
              <Link href="/app/tutor">
                <Button variant="ghost" size="sm" className="lg:hidden">
                  ← Back
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col px-4 sm:px-6">
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center py-8">
              <TutorEmptyState disabled={!tutorEnabled} />
            </div>
          ) : (
            <TutorMessageList messages={messages} isPending={isPending} />
          )}

          {error && (
            <p className="pb-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <TutorComposer
          disabled={!tutorEnabled}
          isPending={isPending}
          onSend={handleSend}
        />
      </section>
    </div>
  );
}
