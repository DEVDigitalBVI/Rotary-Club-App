import { PageHeader } from "@/components/page-header";
import { ChatApp } from "@/components/chat/chat-app";
import { getChatChannels } from "@/lib/data/chat";
import { getCurrentMember, getMembers } from "@/lib/data/members";
import { getCommittees } from "@/lib/data/committees";
import { canPostNews } from "@/lib/mock-data";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/page-container";

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ channel?: string }> }) {
  const currentMember = await getCurrentMember();
  if (!currentMember) redirect("/login");
  const { channel } = await searchParams;
  const [channels, members, committees] = await Promise.all([
    getChatChannels(currentMember.id),
    getMembers(),
    getCommittees(),
  ]);
  return (
    <div>
      <PageHeader title="Chat" description="Message the club or a fellow member directly." />
      <PageContainer>
        <ChatApp
          key={channel ?? "default"}
          channels={channels}
          members={members}
          currentMemberId={currentMember.id}
          canModerate={canPostNews(currentMember, committees)}
          initialChannelId={channel}
        />
      </PageContainer>
    </div>
  );
}
