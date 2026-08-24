import { describe, expect, it } from "vitest";
import { parseRotaryRss } from "../lib/data/rotary-news";

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
});
