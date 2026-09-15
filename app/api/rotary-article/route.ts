import { createClient } from "@/lib/supabase/server";
import { resolveRotaryArticle } from "@/lib/data/rotary-article";
import { normalizeTrustedArticleUrl, normalizeRotaryIndexUrl } from "@/lib/security/news-urls";

const ARTICLE_TIMEOUT_MS = 8_000;
const RATE_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;
const requestWindows = new Map<string, { startedAt: number; count: number }>();

function consumeRequest(userId: string) {
  const now = Date.now();
  const existing = requestWindows.get(userId);
  if (!existing || now - existing.startedAt >= RATE_WINDOW_MS) {
    requestWindows.set(userId, { startedAt: now, count: 1 });
    return true;
  }
  if (existing.count >= MAX_REQUESTS_PER_WINDOW) return false;
  existing.count += 1;
  return true;
}

export async function GET(request: Request) {
  const sourceUrl = new URL(request.url).searchParams.get("url") ?? "";
  const canonicalSourceUrl = normalizeTrustedArticleUrl(sourceUrl, "ri") ?? normalizeRotaryIndexUrl(sourceUrl);
  if (!canonicalSourceUrl) {
    return Response.json({ error: "Invalid Rotary International story URL." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "You must be signed in." }, { status: 401 });
  }
  const { data: activeMember, error: membershipError } = await supabase.rpc("is_active_club_member");
  if (membershipError || !activeMember) {
    return Response.json({ error: "Active club membership is required." }, { status: 403 });
  }
  if (!consumeRequest(user.id)) {
    return Response.json(
      { error: "Too many article requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const controller = new AbortController();
  const abortUpstream = () => controller.abort();
  const timeout = setTimeout(abortUpstream, ARTICLE_TIMEOUT_MS);
  request.signal.addEventListener("abort", abortUpstream, { once: true });
  try {
    const url = await resolveRotaryArticle(canonicalSourceUrl, controller.signal);
    return Response.json(
      { url },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  } catch {
    return Response.json({ error: "This Rotary International story could not be loaded. Please try again." }, { status: 502 });
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", abortUpstream);
  }
}
