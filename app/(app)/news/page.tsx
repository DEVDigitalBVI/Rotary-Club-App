import { PageHeader } from "@/components/page-header";
import { NewsFeed } from "@/components/news/news-feed";
import { PostAnnouncementDialog } from "@/components/news/post-announcement-dialog";
import { newsPosts, currentMember, canPostNews } from "@/lib/mock-data";

export default function NewsPage() {
  return (
    <div>
      <PageHeader
        title="News"
        description="Club announcements, plus updates from District 7020 and Rotary International."
        actions={canPostNews(currentMember) ? <PostAnnouncementDialog /> : undefined}
      />
      <div className="p-4 sm:mx-auto sm:max-w-2xl sm:p-8">
        <NewsFeed posts={newsPosts} />
      </div>
    </div>
  );
}
