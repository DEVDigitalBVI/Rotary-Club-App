import { describe, expect, it, vi } from "vitest";
import { parseRotaryDestination, resolveRotaryArticle } from "../lib/data/rotary-article";
const wrapped = (url: string) => `)]}'\n\n${JSON.stringify([["wrb.fr", "Fbv4je", JSON.stringify(["garturlres", url, 1])]])}`;
describe("Rotary article resolution", () => {
  it("parses framed responses and rejects other publishers", () => {
    expect(parseRotaryDestination(wrapped("https://www.rotary.org/articles/story"))).toBe("https://www.rotary.org/articles/story");
    expect(parseRotaryDestination(wrapped("https://evil.example/story"))).toBeNull();
    expect(parseRotaryDestination("invalid")).toBeNull();
  });
  it("resolves an index article to its validated publisher URL", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response('<div data-n-a-ts="123" data-n-a-sg="signature"></div>')).mockResolvedValueOnce(new Response(wrapped("https://rotary.org/articles/story")));
    vi.stubGlobal("fetch", fetchMock);
    try {
      expect(await resolveRotaryArticle("https://news.google.com/rss/articles/ABC", new AbortController().signal)).toBe("https://www.rotary.org/articles/story");
      expect(fetchMock.mock.calls.every(call => call[1].redirect === "error")).toBe(true);
    } finally { vi.unstubAllGlobals(); }
  });
  it("rejects an arbitrary destination before making a request", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    try {
      await expect(resolveRotaryArticle("https://evil.example", new AbortController().signal)).rejects.toThrow("Invalid article URL");
      expect(fetchMock).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });
});
