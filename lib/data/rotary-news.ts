import type { NewsPost } from "@/lib/mock-data";
import { normalizeTrustedArticleUrl } from "../security/news-urls";

export const ROTARY_RSS_URL = "https://www.rotary.org/rss.xml";
export const ROTARY_NEWS_LIMIT = 2;

function decodeXml(value: string) {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function element(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1].trim()) : "";
}

/** Parse only RI's small, trusted RSS surface; no article HTML is rendered. */
export function parseRotaryRss(xml: string, limit = ROTARY_NEWS_LIMIT): NewsPost[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .slice(0, limit)
    .flatMap((match) => {
      const item = match[1];
      const title = element(item, "title");
      const sourceUrl = normalizeTrustedArticleUrl(element(item, "link"), "ri");
      const body = element(item, "description");
      const publishedAt = element(item, "pubDate");
      if (!title || !sourceUrl || !body || !publishedAt) return [];

      const date = new Date(publishedAt);
      if (Number.isNaN(date.getTime())) return [];
      const thumbnail = item.match(/<media:thumbnail\s+url="([^"]+)"\s*\/?\s*>/i)?.[1];

      return [{
        id: `ri:${sourceUrl}`,
        title,
        body,
        source: "ri" as const,
        date: date.toISOString().slice(0, 10),
        author: "Rotary International",
        sourceUrl,
        image: thumbnail ? { url: decodeXml(thumbnail), alt: title } : undefined,
      }];
    });
}

export async function getLatestRotaryNews(): Promise<NewsPost[]> {
  try {
    const response = await fetch(ROTARY_RSS_URL, {
      cache: "force-cache",
      next: { revalidate: 60 * 60, tags: ["rotary-international-news"] },
      headers: { Accept: "application/rss+xml, application/xml;q=0.9" },
    });
    if (!response.ok) return [];
    return parseRotaryRss(await response.text());
  } catch {
    // The stored RI rows remain available as a resilient fallback.
    return [];
  }
}
