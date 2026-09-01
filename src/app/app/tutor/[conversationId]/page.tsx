import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/require-auth";
import { tutorConfig } from "@/server/tutor/tutor-config";
import {
  getTutorConversation,
  listTutorConversations,
} from "@/server/tutor/tutor-conversation.service";
import { TutorChatView } from "@/components/tutor/tutor-chat-view";

type TutorConversationPageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function TutorConversationPage({
  params,
}: TutorConversationPageProps) {
  const session = await requireAuth();
  const { conversationId } = await params;

  const conversation = await getTutorConversation(session.user.id, conversationId);
  if (!conversation) {
    notFound();
  }

  const conversations = await listTutorConversations(session.user.id);

  return (
    <TutorChatView
      conversations={conversations}
      conversationId={conversation.id}
      initialMessages={conversation.messages}
      title={conversation.title}
      tutorEnabled={tutorConfig.enabled}
    />
  );
}
