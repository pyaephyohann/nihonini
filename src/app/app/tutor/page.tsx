import { requireAuth } from "@/server/auth/require-auth";
import { tutorConfig } from "@/server/tutor/tutor-config";
import { listTutorConversations } from "@/server/tutor/tutor-conversation.service";
import { TutorChatView } from "@/components/tutor/tutor-chat-view";

export default async function TutorPage() {
  const session = await requireAuth();
  const conversations = await listTutorConversations(session.user.id);

  return (
    <TutorChatView
      conversations={conversations}
      tutorEnabled={tutorConfig.enabled}
    />
  );
}
