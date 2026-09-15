import { ChatApp } from "@/components/chat/chat-app";
import { getChatChannels } from "@/lib/data/chat";
import { getCurrentMember, getMemberSummaries } from "@/lib/data/members";
import { getCommittees } from "@/lib/data/committees";
import { canPostNews } from "@/lib/club";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/page-container";

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ channel?: string }> }) {
  const currentMember = await getCurrentMember();
  if (!currentMember) redirect("/login");
  const { channel } = await searchParams;
  const [channels, members, committees] = await Promise.all([
    getChatChannels(currentMember.id, channel),
    getMemberSummaries(),
    getCommittees(),
  ]);
  return (
    <div>
      <header className="mx-auto hidden max-w-[1400px] items-baseline gap-4 px-8 pt-5 pb-3 md:flex"><h1 className="text-2xl font-semibold">Chat</h1><p className="text-sm text-muted-foreground">Your club, in conversation.</p></header>
      <PageContainer className="md:px-8 md:pt-0 md:pb-5">
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
