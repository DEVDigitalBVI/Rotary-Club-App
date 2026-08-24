import { PageHeader } from "@/components/page-header";
import { ChatApp } from "@/components/chat/chat-app";
import { channels, members, currentMember } from "@/lib/mock-data";

export default function ChatPage() {
  return (
    <div>
      <PageHeader title="Chat" description="Message the club or a fellow member directly." />
      <div className="p-4 sm:p-8">
        <ChatApp
          channels={channels}
          members={members}
          currentMemberId={currentMember.id}
          isAdmin={currentMember.role === "admin"}
        />
      </div>
    </div>
  );
}
