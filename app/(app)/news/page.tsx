import { PageHeader } from "@/components/page-header";
import { NewsFeed } from "@/components/news/news-feed";
import { PostAnnouncementDialog } from "@/components/news/post-announcement-dialog";
import { canPostNews } from "@/lib/mock-data";
import { getCurrentMember } from "@/lib/data/members";
import { getCommittees } from "@/lib/data/committees";
import { getNoticeAcknowledgementSummary, getVisibleNewsPosts } from "@/lib/data/news";
import { getEvents } from "@/lib/data/events";
import { PageContainer } from "@/components/page-container";

export default async function NewsPage() {
  const [currentMember, committees, posts, events] = await Promise.all([
    getCurrentMember(),
    getCommittees(),
    getVisibleNewsPosts(),
    getEvents(),
  ]);

  const canEdit = currentMember ? canPostNews(currentMember, committees) : false;
  const acknowledgementSummary = canEdit
    ? await getNoticeAcknowledgementSummary(
        posts.filter((post) => post.requiresAcknowledgement).map((post) => post.id)
      )
    : {};

  return (
    <div>
      <PageHeader
        title="News"
        description="Club announcements, plus updates from District 7020 and Rotary International."
        actions={canEdit ? <PostAnnouncementDialog committees={committees} events={events} /> : undefined}
      />
      <PageContainer className="max-w-3xl">
        <NewsFeed posts={posts} canEdit={canEdit} acknowledgementSummary={acknowledgementSummary} />
      </PageContainer>
    </div>
  );
}
