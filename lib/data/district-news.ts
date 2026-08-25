import type { NewsPost } from "@/lib/mock-data";

export const DISTRICT_NEWS_RSS_URL =
  "https://news.google.com/rss/search?q=site%3A7020.org%2Fstories&hl=en-US&gl=US&ceid=US%3Aen";
export const DISTRICT_STORIES_READER_URL = "https://r.jina.ai/http://www.7020.org/stories";
export const DISTRICT_NEWS_LIMIT = 2;

type DistrictStoryPreview = {
  title: string;
  sourceUrl: string;
  body: string;
  imageUrl?: string;
};

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

/**
 * Parse the narrowly filtered news index for District 7020. The district's
 * ClubRunner site blocks server-side feed requests, so the index is used only
 * for discovery; every accepted item must identify 7020.org as its source.
 */
export function parseDistrictNewsRss(
  xml: string,
  limit = DISTRICT_NEWS_LIMIT
): NewsPost[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .flatMap((match) => {
      const item = match[1];
      const indexedTitle = element(item, "title");
      const sourceUrl = element(item, "link");
      const publishedAt = element(item, "pubDate");
      const source = item.match(/<source\s+url="([^"]+)"[^>]*>([\s\S]*?)<\/source>/i);
      if (!indexedTitle || !sourceUrl || !publishedAt || !source) return [];

      let sourceHost: string;
      try {
        sourceHost = new URL(decodeXml(source[1])).hostname.replace(/^www\./, "");
      } catch {
        return [];
      }
      if (sourceHost !== "7020.org") return [];

      const date = new Date(publishedAt);
      if (Number.isNaN(date.getTime())) return [];
      const title = indexedTitle.replace(/\s+-\s+Rotary District 7020\s*$/i, "").trim();
      if (!title) return [];

      return [{
        id: `district:${sourceUrl}`,
        title,
        body: "Read the latest official update published by Rotary District 7020.",
        source: "district" as const,
        date: date.toISOString().slice(0, 10),
        author: "District 7020",
        sourceUrl,
      }];
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);
}

function plainText(markdown: string) {
  return markdown
    .replace(/^Posted by .+$/gim, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseDistrictStoriesMarkdown(markdown: string): DistrictStoryPreview[] {
  return [...markdown.matchAll(/^### \[([^\]]+)\]\((https:\/\/(?:www\.)?7020\.org\/Stories\/[^)]+)\)\s*\n([\s\S]*?)(?=^### \[|(?![\s\S]))/gim)]
    .map((match) => {
      const section = match[3];
      const imageUrl = section.match(/!\[[^\]]*\]\((https:\/\/clubrunner\.blob\.core\.windows\.net\/[^)]+)\)/i)?.[1];
      const body = plainText(section.replace(/\[Read more\.\.\.\]\([^)]*\)/gi, ""));
      return {
        title: decodeXml(match[1]).trim(),
        sourceUrl: match[2],
        body: body.slice(0, 360),
        imageUrl,
      };
    });
}

function normalizedTitle(title: string) {
  return title.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export async function getLatestDistrictNews(): Promise<NewsPost[]> {
  try {
    const requestOptions = {
      cache: "force-cache" as const,
      next: { revalidate: 60 * 60, tags: ["district-7020-news-v2"] },
    };
    const [indexResponse, storiesResponse] = await Promise.all([
      fetch(DISTRICT_NEWS_RSS_URL, {
        ...requestOptions,
        headers: { Accept: "application/rss+xml, application/xml;q=0.9" },
      }),
      fetch(DISTRICT_STORIES_READER_URL, requestOptions),
    ]);
    if (!indexResponse.ok || !storiesResponse.ok) return [];

    const [indexedPosts, storyPreviews] = await Promise.all([
      indexResponse.text().then((xml) => parseDistrictNewsRss(xml, 25)),
      storiesResponse.text().then(parseDistrictStoriesMarkdown),
    ]);
    const previewsByTitle = new Map(
      storyPreviews.map((preview) => [normalizedTitle(preview.title), preview])
    );

    return indexedPosts.flatMap((post) => {
      const preview = previewsByTitle.get(normalizedTitle(post.title));
      if (!preview) return [];
      return [{
        ...post,
        sourceUrl: preview.sourceUrl,
        body: preview.body || post.body,
        image: preview.imageUrl ? { url: preview.imageUrl, alt: post.title } : undefined,
      }];
    }).slice(0, DISTRICT_NEWS_LIMIT);
  } catch {
    // Stored district rows remain available if the discovery feed is down.
    return [];
  }
}
