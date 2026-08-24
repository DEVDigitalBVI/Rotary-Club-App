import { PageHeader } from "@/components/page-header";
import { NewsFeed } from "@/components/news/news-feed";
import { PostAnnouncementDialog } from "@/components/news/post-announcement-dialog";
import { canPostNews } from "@/lib/mock-data";
import { getCurrentMember } from "@/lib/data/members";
import { getCommittees } from "@/lib/data/committees";
import { getVisibleNewsPosts } from "@/lib/data/news";
import { getEvents } from "@/lib/data/events";

export default async function NewsPage() {
  const [currentMember, committees, posts, events] = await Promise.all([
    getCurrentMember(),
    getCommittees(),
    getVisibleNewsPosts(),
    getEvents(),
  ]);

  const canEdit = currentMember ? canPostNews(currentMember, committees) : false;

  return (
    <div>
      <PageHeader
        title="News"
        description="Club announcements, plus updates from District 7020 and Rotary International."
        actions={canEdit ? <PostAnnouncementDialog committees={committees} events={events} /> : undefined}
      />
      <div className="p-4 sm:mx-auto sm:max-w-2xl sm:p-8">
        <NewsFeed posts={posts} canEdit={canEdit} />
      </div>
    </div>
  );
}
