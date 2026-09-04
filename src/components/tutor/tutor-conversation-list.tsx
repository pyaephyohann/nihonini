"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { deleteTutorConversationAction } from "@/server/tutor/tutor.actions";
import type { TutorConversationSummary } from "@/types/tutor";

type TutorConversationListProps = {
  conversations: TutorConversationSummary[];
  activeConversationId?: string;
};

type PendingDelete = {
  id: string;
  title: string;
};

export function TutorConversationList({
  conversations,
  activeConversationId,
}: TutorConversationListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const handleDeleteRequest = (conversationId: string, title: string) => {
    setPendingDelete({ id: conversationId, title });
  };

  const handleDeleteCancel = () => {
    setPendingDelete(null);
  };

  const handleDeleteConfirm = () => {
    if (!pendingDelete) {
      return;
    }

    const conversationId = pendingDelete.id;
    setPendingDelete(null);

    startTransition(async () => {
      const result = await deleteTutorConversationAction(conversationId);
      if ("error" in result) {
        return;
      }

      if (activeConversationId === conversationId) {
        router.push("/app/tutor");
      } else {
        router.refresh();
      }
    });
  };

  if (conversations.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">No conversations yet.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;
          return (
            <Card
              key={conversation.id}
              className={cn(
                "p-3 transition-colors",
                isActive && "border-primary bg-secondary/60",
              )}
            >
              <div className="flex items-start gap-2">
                <Link
                  href={`/app/tutor/${conversation.id}`}
                  className="min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <p className="truncate font-medium text-foreground">
                    {conversation.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(conversation.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 px-2"
                  disabled={isPending}
                  aria-label={`Delete conversation ${conversation.title}`}
                  onClick={() => handleDeleteRequest(conversation.id, conversation.title)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete conversation?"
        description={
          pendingDelete
            ? `Delete "${pendingDelete.title}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
