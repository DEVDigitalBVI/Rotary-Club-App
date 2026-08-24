import { createClient } from "@/lib/supabase/server";
import { visibleNewsPosts, type NewsPost, type NewsSource } from "@/lib/mock-data";

type NewsPostRow = {
  id: string;
  source: NewsSource;
  title: string;
  body: string;
  author: string;
  published_at: string;
  image_url: string | null;
  image_alt: string | null;
  source_url: string | null;
};

function toNewsPost(row: NewsPostRow): NewsPost {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    source: row.source,
    date: row.published_at,
    author: row.author,
    image: row.image_url ? { url: row.image_url, alt: row.image_alt ?? "" } : undefined,
    sourceUrl: row.source_url ?? undefined,
  };
}

/** Same capping rules as the mock version (visibleNewsPosts), applied to real rows. */
export async function getVisibleNewsPosts(): Promise<NewsPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news_posts")
    .select("id, source, title, body, author, published_at, image_url, image_alt, source_url")
    .order("published_at", { ascending: false })
    .returns<NewsPostRow[]>();

  return visibleNewsPosts((data ?? []).map(toNewsPost));
}
