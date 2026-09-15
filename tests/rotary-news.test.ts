import { describe, expect, it, vi } from "vitest";
import { parseRotaryRss, parseRotaryIndex, getLatestRotaryNews, ROTARY_INDEX_URL } from "../lib/data/rotary-news";

const feed = `<?xml version="1.0"?><rss xmlns:media="http://search.yahoo.com/mrss/"><channel>
  <item><title><![CDATA[First & latest]]></title><link>https://www.rotary.org/en/first</link><pubDate>Thu, 20 Aug 2026 13:41:00 GMT</pubDate><description><![CDATA[First summary]]></description><media:thumbnail url="https://images.example/first.jpg" /></item>
  <item><title><![CDATA[Second story]]></title><link>https://www.rotary.org/en/second</link><pubDate>Thu, 20 Aug 2026 13:40:00 GMT</pubDate><description><![CDATA[Second summary]]></description></item>
  <item><title><![CDATA[Third story]]></title><link>https://www.rotary.org/en/third</link><pubDate>Thu, 20 Aug 2026 13:39:00 GMT</pubDate><description><![CDATA[Third summary]]></description></item>
</channel></rss>`;

describe("Rotary International RSS", () => {
  it("returns only the latest two items in feed order", () => {
    const posts = parseRotaryRss(feed);
    expect(posts).toHaveLength(2);
    expect(posts.map((post) => post.title)).toEqual(["First & latest", "Second story"]);
  });

  it("maps canonical links, dates, summaries, and optional images", () => {
    const [post] = parseRotaryRss(feed);
    expect(post).toMatchObject({
      source: "ri",
      date: "2026-08-20",
      body: "First summary",
      sourceUrl: "https://www.rotary.org/en/first",
      image: { url: "https://images.example/first.jpg", alt: "First & latest" },
    });
  });

  it("skips malformed items instead of publishing partial stories", () => {
    expect(parseRotaryRss("<rss><item><title>Missing fields</title></item></rss>"))
      .toEqual([]);
  });

  it("rejects feed links outside the approved HTTPS Rotary origin", () => {
    const malicious = `<rss><channel><item><title>Looks official</title><link>https://evil.example/phish</link><pubDate>Thu, 20 Aug 2026 13:41:00 GMT</pubDate><description>Summary</description></item></channel></rss>`;
    const insecure = `<rss><channel><item><title>Insecure</title><link>http://www.rotary.org/en/story</link><pubDate>Thu, 20 Aug 2026 13:41:00 GMT</pubDate><description>Summary</description></item></channel></rss>`;
    expect(parseRotaryRss(malicious)).toEqual([]);
    expect(parseRotaryRss(insecure)).toEqual([]);
  });
});

const indexedItem = (title: string, publisher = "https://www.rotary.org", link = "https://news.google.com/rss/articles/ABC123?oc=5", date = "Thu, 10 Sep 2026 07:00:00 GMT") => `<item><title>${title} - Rotary International</title><source url="${publisher}">Rotary International</source><link>${link}</link><pubDate>${date}</pubDate></item>`;

describe("Rotary news fallback", () => {
  it("accepts only Rotary.org publishers and narrowly validated index links", () => {
    const xml = indexedItem("Official story") + indexedItem("Wrong publisher", "https://evil.example") + indexedItem("Wrong link", "https://www.rotary.org", "https://news.google.com/redirect?url=https://evil.example");
    expect(parseRotaryIndex(xml).map(post => post.title)).toEqual(["Official story"]);
  });

  it("sorts valid results before limiting and removes duplicate articles", () => {
    const old = indexedItem("Old", undefined, "https://news.google.com/rss/articles/OLD", "Thu, 20 Aug 2026 07:00:00 GMT");
    const recent = indexedItem("Recent");
    expect(parseRotaryIndex(old + recent + recent, 1).map(post => post.title)).toEqual(["Recent"]);
  });

  it("falls back when the official RSS returns a security checkpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response("Security checkpoint", { status: 429 })).mockResolvedValueOnce(new Response(indexedItem("Available news")));
    vi.stubGlobal("fetch", fetchMock);
    try {
      expect((await getLatestRotaryNews())[0].title).toBe("Available news");
      expect(fetchMock.mock.calls[1][0]).toBe(ROTARY_INDEX_URL);
    } finally { vi.unstubAllGlobals(); }
  });

  it("falls back when a successful response contains HTML instead of RSS", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("<html>Checkpoint</html>")).mockResolvedValueOnce(new Response(indexedItem("Available news"))));
    try { expect(await getLatestRotaryNews()).toHaveLength(1); }
    finally { vi.unstubAllGlobals(); }
  });

  it("keeps a working official feed without requesting the fallback", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(feed));
    vi.stubGlobal("fetch", fetchMock);
    try {
      expect(await getLatestRotaryNews()).toHaveLength(2);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally { vi.unstubAllGlobals(); }
  });
});
