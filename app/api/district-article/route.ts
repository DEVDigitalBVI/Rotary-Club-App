import { createClient } from "@/lib/supabase/server";
import { readResponseTextWithLimit } from "@/lib/security/bounded-response";
import { normalizeDistrictStoryUrl } from "@/lib/security/news-urls";

const ARTICLE_TIMEOUT_MS = 8_000;
const MAX_ARTICLE_BYTES = 1_000_000;
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
  const canonicalSourceUrl = normalizeDistrictStoryUrl(sourceUrl);
  if (!canonicalSourceUrl) {
    return Response.json({ error: "Invalid District 7020 story URL." }, { status: 400 });
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

  const source = new URL(canonicalSourceUrl);
  const readerUrl = `https://r.jina.ai/http://www.7020.org${source.pathname}`;
  const controller = new AbortController();
  const abortUpstream = () => controller.abort();
  const timeout = setTimeout(abortUpstream, ARTICLE_TIMEOUT_MS);
  request.signal.addEventListener("abort", abortUpstream, { once: true });
  try {
    const response = await fetch(readerUrl, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "text/markdown, text/plain;q=0.9" },
    });
    if (!response.ok) throw new Error("Reader request failed");
    const rendered = await readResponseTextWithLimit(response, MAX_ARTICLE_BYTES);
    const content = rendered.split("Markdown Content:")[1]?.trim() ?? "";
    if (!content) throw new Error("Reader returned no article content");
    return Response.json(
      { content },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  } catch {
    return Response.json({ error: "This District 7020 story could not be loaded." }, { status: 502 });
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", abortUpstream);
  }
}
