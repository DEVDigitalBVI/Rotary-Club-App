import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { readResponseTextWithLimit } from "../lib/security/bounded-response";
import {
  normalizeDistrictStoryUrl,
  normalizeTrustedArticleUrl,
} from "../lib/security/news-urls";

describe("trusted syndicated article URLs", () => {
  it("canonicalizes the supported District story URL without query variants", () => {
    expect(normalizeDistrictStoryUrl("https://7020.org/Stories/Rotary-%E2%80%99-update"))
      .toBe("https://www.7020.org/Stories/Rotary-%E2%80%99-update");
    expect(normalizeDistrictStoryUrl("https://www.7020.org/stories/update?cache=bust"))
      .toBeNull();
    expect(normalizeDistrictStoryUrl("https://www.7020.org/stories/a/b"))
      .toBeNull();
    expect(normalizeDistrictStoryUrl("https://www.7020.org/stories/a%2Fb"))
      .toBeNull();
  });

  it("allows only credential-free HTTPS publisher origins", () => {
    expect(normalizeTrustedArticleUrl("https://rotary.org/en/story?q=1", "ri"))
      .toBe("https://www.rotary.org/en/story?q=1");
    expect(normalizeTrustedArticleUrl("http://www.rotary.org/en/story", "ri"))
      .toBeNull();
    expect(normalizeTrustedArticleUrl("https://rotary.org.evil.example/story", "ri"))
      .toBeNull();
    expect(normalizeTrustedArticleUrl("https://user:pass@www.rotary.org/story", "ri"))
      .toBeNull();
  });

  it("keeps the browser sink sandboxed and revalidates its URL", () => {
    const component = readFileSync(
      resolve(process.cwd(), "components/news/article-reader-dialog.tsx"),
      "utf8"
    );
    expect(component).toContain("normalizeTrustedArticleUrl(url, source)");
    expect(component).toContain('sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-scripts"');
    expect(component).not.toContain("allow-same-origin");
  });
});

describe("bounded upstream article responses", () => {
  it("rejects an oversized declared response", async () => {
    const response = new Response("too large", {
      headers: { "Content-Length": "500" },
    });
    await expect(readResponseTextWithLimit(response, 100)).rejects
      .toThrow("Response exceeds the permitted size");
  });

  it("rejects an oversized streamed response and accepts a bounded one", async () => {
    await expect(readResponseTextWithLimit(new Response("123456"), 5)).rejects
      .toThrow("Response exceeds the permitted size");
    await expect(readResponseTextWithLimit(new Response("12345"), 5))
      .resolves.toBe("12345");
  });
});
