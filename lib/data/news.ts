import { createClient } from "@/lib/supabase/server";
import { throwOnSupabaseError } from "@/lib/supabase/errors";
import { visibleNewsPosts, type NewsPost, type NewsSource } from "@/lib/mock-data";
import { getLatestRotaryNews } from "@/lib/data/rotary-news";

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
  audience_type: "all" | "board" | "committee" | "event";
  audience_id: string | null;
  priority: "normal" | "important" | "urgent";
  is_pinned: boolean;
  expires_at: string | null;
  requires_acknowledgement: boolean;
};

function toNewsPost(row: NewsPostRow, acknowledgedAt?: string): NewsPost {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    source: row.source,
    date: row.published_at,
    author: row.author,
    image: row.image_url ? { url: row.image_url, alt: row.image_alt ?? "" } : undefined,
    sourceUrl: row.source_url ?? undefined,
    audience: { type: row.audience_type, id: row.audience_id ?? undefined },
    priority: row.priority,
    isPinned: row.is_pinned,
    expiresAt: row.expires_at ?? undefined,
    requiresAcknowledgement: row.requires_acknowledgement,
    acknowledgedAt,
  };
}

/** Same capping rules as the mock version (visibleNewsPosts), applied to real rows. */
export async function getVisibleNewsPosts(): Promise<NewsPost[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data, error }, memberResult, latestRotaryNews] = await Promise.all([
    supabase
    .from("news_posts")
    .select("id, source, title, body, author, published_at, image_url, image_alt, source_url, audience_type, audience_id, priority, is_pinned, expires_at, requires_acknowledgement")
    .order("published_at", { ascending: false })
    .returns<NewsPostRow[]>(),
    user
      ? supabase.from("members").select("id").eq("user_id", user.id).maybeSingle<{ id: string }>()
      : Promise.resolve({ data: null, error: null }),
    getLatestRotaryNews(),
  ]);
  throwOnSupabaseError(error, "Unable to load news posts");

  const memberId = memberResult.data?.id;
  const acknowledgementResult = memberId
    ? await supabase
        .from("news_acknowledgements")
        .select("post_id, acknowledged_at")
        .eq("member_id", memberId)
        .returns<{ post_id: string; acknowledged_at: string }[]>()
    : { data: [], error: null };
  throwOnSupabaseError(acknowledgementResult.error, "Unable to load notice acknowledgements");

  const acknowledged = new Map(
    (acknowledgementResult.data ?? []).map((row) => [row.post_id, row.acknowledged_at])
  );
  const today = new Date().toISOString().slice(0, 10);
  const priorityRank = { urgent: 0, important: 1, normal: 2 } as const;

  const storedRows = (data ?? [])
      .filter((row) => !row.expires_at || row.expires_at >= today)
      .map((row) => toNewsPost(row, acknowledged.get(row.id)));
  const posts = latestRotaryNews.length === 2
    ? [...storedRows.filter((post) => post.source !== "ri"), ...latestRotaryNews]
    : storedRows;

  return visibleNewsPosts(posts).sort((a, b) => {
    if (Boolean(a.isPinned) !== Boolean(b.isPinned)) return a.isPinned ? -1 : 1;
    const priorityDifference = priorityRank[a.priority ?? "normal"] - priorityRank[b.priority ?? "normal"];
    if (priorityDifference !== 0) return priorityDifference;
    return a.date < b.date ? 1 : -1;
  });
}

export async function getNoticeAcknowledgementSummary(
  postIds: string[]
): Promise<Record<string, string[]>> {
  if (postIds.length === 0) return {};
  const supabase = await createClient();
  const [acknowledgementsResult, membersResult] = await Promise.all([
    supabase
      .from("news_acknowledgements")
      .select("post_id, member_id")
      .in("post_id", postIds)
      .returns<{ post_id: string; member_id: string }[]>(),
    supabase.from("members").select("id, name").returns<{ id: string; name: string }[]>(),
  ]);
  throwOnSupabaseError(acknowledgementsResult.error, "Unable to load notice acknowledgements");
  throwOnSupabaseError(membersResult.error, "Unable to load acknowledgement members");

  const memberNames = new Map((membersResult.data ?? []).map((member) => [member.id, member.name]));
  const summary: Record<string, string[]> = {};
  for (const acknowledgement of acknowledgementsResult.data ?? []) {
    const name = memberNames.get(acknowledgement.member_id);
    if (!name) continue;
    summary[acknowledgement.post_id] = [...(summary[acknowledgement.post_id] ?? []), name];
  }
  return summary;
}
