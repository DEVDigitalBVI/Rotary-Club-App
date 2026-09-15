const DISTRICT_HOST = "7020.org";
const ROTARY_HOST = "rotary.org";
const MAX_DISTRICT_PATH_LENGTH = 240;

function hasSafeHttpsAuthority(url: URL) {
  return url.protocol === "https:" && !url.username && !url.password && !url.port;
}

/** Canonicalize the one District URL shape the article proxy supports. */
export function normalizeDistrictStoryUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!hasSafeHttpsAuthority(url) || hostname !== DISTRICT_HOST) return null;
    if (url.search || url.hash || url.pathname.length > MAX_DISTRICT_PATH_LENGTH) return null;
    if (!/^\/stories\/[^/]+\/?$/i.test(url.pathname)) return null;
    if (/\\|%2f|%5c/i.test(url.pathname)) return null;
    return `https://www.${DISTRICT_HOST}${url.pathname}`;
  } catch {
    return null;
  }
}

/** Validate again at the browser sink, including stored syndicated rows. */
export function normalizeTrustedArticleUrl(
  value: string,
  source: "ri" | "district"
): string | null {
  if (source === "district") return normalizeDistrictStoryUrl(value);

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!hasSafeHttpsAuthority(url) || hostname !== ROTARY_HOST || url.hash) return null;
    url.hostname = `www.${ROTARY_HOST}`;
    return url.toString();
  } catch {
    return null;
  }
}

/** Only Google News article links, never arbitrary Google redirect URLs. */
export function normalizeRotaryIndexUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (!hasSafeHttpsAuthority(url) || url.hostname !== "news.google.com" || url.hash) return null;
    if (!/^\/rss\/articles\/[A-Za-z0-9_-]+$/.test(url.pathname)) return null;
    if ([...url.searchParams].some(([key, value]) => key !== "oc" || value !== "5")) return null;
    return url.toString();
  } catch {
    return null;
  }
}
