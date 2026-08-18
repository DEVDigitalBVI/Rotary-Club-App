"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { NewsSourceBadge } from "@/components/news-source-badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";
import type { NewsPost, NewsSource } from "@/lib/mock-data";

export function NewsFeed({ posts }: { posts: NewsPost[] }) {
  const [filter, setFilter] = useState<NewsSource | "all">("all");

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

      <div className="flex flex-col gap-4">
        {filtered.map((post) => (
          <Card key={post.id}>
            <CardContent>
              <div className="flex items-center gap-2">
                <NewsSourceBadge source={post.source} />
                <span className="text-xs text-muted-foreground">
                  {formatDate(post.date)}
                </span>
              </div>
              <h2 className="font-heading mt-2 text-base font-semibold text-foreground">
                {post.title}
              </h2>
              <p className="font-body mt-1.5 text-sm leading-relaxed text-foreground">
                {post.body}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">By {post.author}</p>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No news in this category yet.
          </p>
        )}
      </div>
    </div>
  );
}
