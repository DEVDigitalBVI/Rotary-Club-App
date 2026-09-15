import { Suspense } from "react";
import Link from "next/link";
import type { NewsSource } from "@/lib/club";
import { PageHeader } from "@/components/page-header";
import { NewsFeed } from "@/components/news/news-feed";
import { PostAnnouncementDialog } from "@/components/news/post-announcement-dialog";
import { canPostNews } from "@/lib/club";
import { getCurrentMember } from "@/lib/data/members";
import { getCommittees } from "@/lib/data/committees";
import { getNoticeAcknowledgementSummary, getVisibleNewsPosts, getExternalNewsPosts } from "@/lib/data/news";
import { getEvents } from "@/lib/data/events";
import { PageContainer } from "@/components/page-container";

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const { source } = await searchParams;
  const filter: NewsSource | "all" = source === "club" || source === "district" || source === "ri" ? source : "all";
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
        <nav aria-label="News sources" className="mb-5 flex flex-wrap gap-2">
          {([["all", "All"], ["club", "Club"], ["district", "District"], ["ri", "Rotary Intl."]] as const).map(([value, label]) => (
            <Link key={value} href={`/news?source=${value}`} aria-current={filter === value ? "page" : undefined} className={`rounded-lg px-3 py-2 text-sm font-semibold ${filter === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{label}</Link>
          ))}
        </nav>
        {(filter === "all" || filter === "club") && <NewsFeed posts={posts} filter="club" canEdit={canEdit} acknowledgementSummary={acknowledgementSummary} />}
        {filter !== "club" && <Suspense key={filter} fallback={<p className="mt-6 text-sm text-muted-foreground">Loading district and international news…</p>}><ExternalNews filter={filter} /></Suspense>}
      </PageContainer>
    </div>
  );
}

async function ExternalNews({ filter }: { filter: "all" | "ri" | "district" }) {
  const posts = await getExternalNewsPosts().catch(() => null);
  if (!posts) return <p className="mt-6 text-sm text-muted-foreground">External news is temporarily unavailable. Club notices are still available above.</p>;
  return <section className="mt-8"><h2 className="mb-5 text-xl">Around Rotary</h2><NewsFeed posts={posts} filter={filter} canEdit={false} acknowledgementSummary={{}} /></section>;
}
