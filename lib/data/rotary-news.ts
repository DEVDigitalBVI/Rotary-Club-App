import { decodeXml, element } from "./rss";
import type { NewsPost } from "@/lib/club";
import { normalizeTrustedArticleUrl, normalizeRotaryIndexUrl } from "../security/news-urls";

export const ROTARY_RSS_URL = "https://www.rotary.org/rss.xml";
export const ROTARY_INDEX_URL = "https://news.google.com/rss/search?q=site%3Awww.rotary.org%20when%3A90d&hl=en-US&gl=US&ceid=US%3Aen";
export const ROTARY_NEWS_LIMIT = 2;

/** Parse only RI's small, trusted RSS surface; no article HTML is rendered. */
export function parseRotaryRss(xml: string, limit = ROTARY_NEWS_LIMIT): NewsPost[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
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
    }).slice(0, limit);
}

/** The index is a fallback; accept only results attributed to Rotary's own site. */
export function parseRotaryIndex(xml: string, limit = ROTARY_NEWS_LIMIT): NewsPost[] {
  const seen = new Set<string>();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].flatMap((match) => {
    const item = match[1];
    const publisher = item.match(/<source\s+url="([^"]+)"[^>]*>/i)?.[1];
    if (!publisher || !/^https:\/\/(?:www\.)?rotary\.org\/?$/.test(decodeXml(publisher))) return [];
    const sourceUrl = normalizeRotaryIndexUrl(element(item, "link"));
    const title = element(item, "title").replace(/\s+-\s+Rotary International\s*$/i, "").trim();
    const date = new Date(element(item, "pubDate"));
    if (!sourceUrl || !title || Number.isNaN(date.getTime()) || seen.has(sourceUrl)) return [];
    seen.add(sourceUrl);
    return [{ id: `ri:${sourceUrl}`, title, sourceUrl, source: "ri" as const,
      body: "Read this story published by Rotary International.",
      date: date.toISOString().slice(0, 10), author: "Rotary International" }];
  }).sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

async function fetchNews(url: string, parse: (xml: string) => NewsPost[]): Promise<NewsPost[]> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      cache: "force-cache",
      next: { revalidate: 60 * 60, tags: ["rotary-international-news"] },
      headers: { Accept: "application/rss+xml, application/xml;q=0.9" },
    });
    if (!response.ok) return [];
    return parse(await response.text());
  } catch {
    return [];
  }
}

export async function getLatestRotaryNews(): Promise<NewsPost[]> {
  const direct = await fetchNews(ROTARY_RSS_URL, parseRotaryRss);
  return direct.length ? direct : fetchNews(ROTARY_INDEX_URL, parseRotaryIndex);
}
