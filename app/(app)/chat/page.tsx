import { PageHeader } from "@/components/page-header";
import { ChatApp } from "@/components/chat/chat-app";
import { getChatChannels } from "@/lib/data/chat";
import { getCurrentMember, getMembers } from "@/lib/data/members";
import { redirect } from "next/navigation";

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ channel?: string }> }) {
  const currentMember = await getCurrentMember();
  if (!currentMember) redirect("/login");
  const { channel } = await searchParams;
  const [channels, members] = await Promise.all([
    getChatChannels(currentMember.id),
    getMembers(),
  ]);
  return (
    <div>
      <PageHeader title="Chat" description="Message the club or a fellow member directly." />
      <div className="p-4 sm:p-8">
        <ChatApp
          key={channel ?? "default"}
          channels={channels}
          members={members}
          currentMemberId={currentMember.id}
          canModerate={currentMember.role === "admin"}
          initialChannelId={channel}
        />
      </div>
    </div>
  );
}
