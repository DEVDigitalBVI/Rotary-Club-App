import { describe, expect, it } from "vitest";
import { parseDistrictNewsRss, parseDistrictStoriesMarkdown } from "../lib/data/district-news";

const feed = `<?xml version="1.0"?><rss><channel>
  <item><title>Older story - Rotary District 7020</title><link>https://news.google.com/rss/articles/older</link><pubDate>Mon, 24 Aug 2026 12:00:00 GMT</pubDate><source url="https://7020.org">Rotary District 7020</source></item>
  <item><title><![CDATA[Newest &amp; official - Rotary District 7020]]></title><link>https://news.google.com/rss/articles/newest</link><pubDate>Tue, 25 Aug 2026 12:00:00 GMT</pubDate><source url="https://www.7020.org">Rotary District 7020</source></item>
  <item><title>Other source</title><link>https://news.google.com/rss/articles/other</link><pubDate>Tue, 25 Aug 2026 13:00:00 GMT</pubDate><source url="https://example.com">Example</source></item>
  <item><title>Third district story - Rotary District 7020</title><link>https://news.google.com/rss/articles/third</link><pubDate>Sun, 23 Aug 2026 12:00:00 GMT</pubDate><source url="https://7020.org">Rotary District 7020</source></item>
</channel></rss>`;

describe("District 7020 news RSS", () => {
  it("returns the newest two official district items", () => {
    const posts = parseDistrictNewsRss(feed);
    expect(posts.map((post) => post.title)).toEqual(["Newest & official", "Older story"]);
  });

  it("maps dates, authorship, and reader links", () => {
    expect(parseDistrictNewsRss(feed)[0]).toMatchObject({
      source: "district",
      date: "2026-08-25",
      author: "District 7020",
      sourceUrl: "https://news.google.com/rss/articles/newest",
    });
  });

  it("rejects indexed stories that are not from the official district site", () => {
    expect(parseDistrictNewsRss(feed, 10).some((post) => post.title === "Other source"))
      .toBe(false);
  });

  it("skips malformed source URLs instead of failing the whole feed", () => {
    const malformed = `<rss><channel><item><title>Bad source</title><link>https://news.google.com/item</link><pubDate>Tue, 25 Aug 2026 12:00:00 GMT</pubDate><source url="not a URL">District</source></item></channel></rss>`;
    expect(parseDistrictNewsRss(malformed)).toEqual([]);
  });

  it("extracts direct official links and summaries from the district listing", () => {
    const markdown = `### [Newest & official](https://www.7020.org/Stories/newest-official)\n\nPosted by District Editor\n\n![Photo](https://clubrunner.blob.core.windows.net/00000050041/Images/photo.jpg)\n\nA useful district summary.\n\n[Read more...](https://www.7020.org/Stories/newest-official)\n### [Second](https://www.7020.org/Stories/second)\n\nAnother update.`;
    expect(parseDistrictStoriesMarkdown(markdown)[0]).toMatchObject({
      title: "Newest & official",
      sourceUrl: "https://www.7020.org/Stories/newest-official",
      body: "A useful district summary.",
      imageUrl: "https://clubrunner.blob.core.windows.net/00000050041/Images/photo.jpg",
    });
  });
});
