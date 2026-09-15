import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { NewsFeed } from "@/components/news/news-feed";
import { PostAnnouncementDialog } from "@/components/news/post-announcement-dialog";
import { canPostNews } from "@/lib/club";
import { getCurrentMember } from "@/lib/data/members";
import { getCommittees } from "@/lib/data/committees";
import { getNoticeAcknowledgementSummary, getVisibleNewsPosts, getExternalNewsPosts } from "@/lib/data/news";
import { getEvents } from "@/lib/data/events";
import { PageContainer } from "@/components/page-container";

export default async function NewsPage() {
  const [currentMember, committees, posts] = await Promise.all([
    getCurrentMember(),
    getCommittees(),
    getVisibleNewsPosts({ clubOnly: true }),
  ]);

  const canEdit = currentMember ? canPostNews(currentMember, committees) : false;
  const eventsPromise = canEdit ? getEvents() : Promise.resolve([]);
  const acknowledgementSummary = canEdit
    ? await getNoticeAcknowledgementSummary(
        posts.filter((post) => post.requiresAcknowledgement).map((post) => post.id)
      )
    : {};

  const events = await eventsPromise;

  return (
    <div>
      <PageHeader
        title="News"
        description="Club announcements, plus updates from District 7020 and Rotary International."
        actions={canEdit ? <PostAnnouncementDialog committees={committees} events={events} /> : undefined}
      />
      <PageContainer className="max-w-3xl">
        <NewsFeed posts={posts} canEdit={canEdit} acknowledgementSummary={acknowledgementSummary} />
        <Suspense fallback={<p className="mt-6 text-sm text-muted-foreground">Loading district and international news…</p>}><ExternalNews /></Suspense>
      </PageContainer>
    </div>
  );
}

async function ExternalNews() {
  const posts = await getExternalNewsPosts().catch(() => null);
  if (!posts) return <p className="mt-6 text-sm text-muted-foreground">External news is temporarily unavailable. Club notices are still available above.</p>;
  return <section className="mt-8"><h2 className="mb-5 text-xl">Around Rotary</h2><NewsFeed posts={posts} canEdit={false} acknowledgementSummary={{}} /></section>;
}
