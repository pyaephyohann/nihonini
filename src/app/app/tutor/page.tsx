import { requireAuth } from "@/server/auth/require-auth";
import { tutorConfig } from "@/server/tutor/tutor-config";
import { listTutorConversations } from "@/server/tutor/tutor-conversation.service";
import { findSafeUserById } from "@/server/users/user.repository";
import { TutorChatView } from "@/components/tutor/tutor-chat-view";

export default async function TutorPage() {
  const session = await requireAuth();
  const [conversations, user] = await Promise.all([
    listTutorConversations(session.user.id),
    findSafeUserById(session.user.id),
  ]);

  return (
    <TutorChatView
      conversations={conversations}
      tutorEnabled={tutorConfig.enabled}
      learnerLevel={user?.profile?.japaneseLevel}
    />
  );
}
