"use client";

import { useState } from "react";
import { AlertTriangle, Pencil, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NewsSourceBadge } from "@/components/news-source-badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditNewsDialog } from "@/components/news/edit-news-dialog";
import { formatDate } from "@/lib/format";
import { NoticeAcknowledgement } from "@/components/news/notice-acknowledgement";
import { ArticleReaderDialog } from "@/components/news/article-reader-dialog";
import {
  isSyndicated,
  newsFeeds,
  type NewsPost,
  type NewsSource,
} from "@/lib/mock-data";

export function NewsFeed({
  posts,
  canEdit = false,
  acknowledgementSummary = {},
}: {
  posts: NewsPost[];
  /** Officers and committee directors can correct their own club's posts. */
  canEdit?: boolean;
  acknowledgementSummary?: Record<string, string[]>;
}) {
  const [filter, setFilter] = useState<NewsSource | "all">("all");
  const [editing, setEditing] = useState<NewsPost | null>(null);

  const filtered = posts.filter((p) => filter === "all" || p.source === filter);

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as NewsSource | "all")}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="club">Club</TabsTrigger>
          <TabsTrigger value="district">District</TabsTrigger>
          <TabsTrigger value="ri">Rotary Intl.</TabsTrigger>
        </TabsList>
      </Tabs>

      {filter !== "all" && filter !== "club" && (
        <p className="text-xs text-muted-foreground">
          Pulled from {newsFeeds[filter].name}. The club doesn&apos;t edit these
          — they link back to the original.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {filtered.map((post) => (
          <Card key={post.id} className={`overflow-hidden ${post.priority === "urgent" ? "border-[var(--notice-urgent)]" : post.priority === "important" ? "border-[var(--notice-important)]/50" : ""}`}>
            {post.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.image.url}
                alt={post.image.alt}
                className="aspect-[16/9] w-full object-cover"
              />
            )}
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <NewsSourceBadge source={post.source} />
                  {post.isPinned && <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wider text-primary"><Pin className="size-3" />Pinned</span>}
                  {post.priority && post.priority !== "normal" && <span className={`inline-flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wider ${post.priority === "urgent" ? "text-[var(--notice-urgent)]" : "text-[var(--notice-important)]"}`}><AlertTriangle className="size-3" />{post.priority}</span>}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(post.date)}
                  </span>
                </div>
                {canEdit && !isSyndicated(post) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit post"
                    className="text-muted-foreground"
                    onClick={() => setEditing(post)}
                  >
                    <Pencil />
                  </Button>
                )}
              </div>
              <h2 className="font-heading mt-2 text-base font-semibold text-foreground">
                {post.title}
              </h2>
              <p className="font-body mt-1.5 text-sm leading-relaxed text-foreground">
                {post.body}
              </p>
              {post.expiresAt && <p className="mt-2 text-xs font-medium text-muted-foreground">Visible through {formatDate(post.expiresAt)}</p>}
              {post.requiresAcknowledgement && post.source === "club" && (
                <div className="mt-4 border-t border-border pt-4">
                  <NoticeAcknowledgement postId={post.id} acknowledgedAt={post.acknowledgedAt} />
                  {canEdit && (
                    <details className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs">
                      <summary className="cursor-pointer font-semibold text-foreground">
                        {acknowledgementSummary[post.id]?.length ?? 0} acknowledged
                      </summary>
                      <div className="mt-2 text-muted-foreground">
                        {acknowledgementSummary[post.id]?.length
                          ? acknowledgementSummary[post.id].sort().join(", ")
                          : "No acknowledgements yet."}
                      </div>
                    </details>
                  )}
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {isSyndicated(post) ? post.author : `By ${post.author}`}
                </p>
                {/* Syndicated items are summaries of someone else's article, so
                    they always offer the way back to the original. */}
                {post.sourceUrl && (
                  <ArticleReaderDialog
                    title={post.title}
                    url={post.sourceUrl}
                    source={post.source as Exclude<NewsSource, "club">}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No news in this category yet.
          </p>
        )}
      </div>

      <EditNewsDialog
        post={editing}
        open={editing !== null}
        onOpenChange={(next) => {
          if (!next) setEditing(null);
        }}
      />
    </div>
  );
}
