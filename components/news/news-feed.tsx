"use client";

import { useState } from "react";
import { ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NewsSourceBadge } from "@/components/news-source-badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditNewsDialog } from "@/components/news/edit-news-dialog";
import { formatDate } from "@/lib/format";
import {
  isSyndicated,
  newsFeeds,
  type NewsPost,
  type NewsSource,
} from "@/lib/mock-data";

export function NewsFeed({
  posts,
  canEdit = false,
}: {
  posts: NewsPost[];
  /** Officers and committee directors can correct their own club's posts. */
  canEdit?: boolean;
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
          <Card key={post.id} className="overflow-hidden">
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
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {isSyndicated(post) ? post.author : `By ${post.author}`}
                </p>
                {/* Syndicated items are summaries of someone else's article, so
                    they always offer the way back to the original. */}
                {post.sourceUrl && (
                  <a
                    href={post.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Read the full story
                    <ExternalLink className="size-3" />
                  </a>
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
