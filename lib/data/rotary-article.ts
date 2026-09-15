import { readResponseTextWithLimit } from "@/lib/security/bounded-response";
import { normalizeRotaryIndexUrl, normalizeTrustedArticleUrl } from "@/lib/security/news-urls";

/** Decode the public index response, then validate the publisher again. */
export function parseRotaryDestination(text: string): string | null {
  for (const line of text.split("\n")) {
    if (!line.startsWith("[[")) continue;
    try {
      const rows: unknown = JSON.parse(line);
      if (!Array.isArray(rows)) continue;
      for (const row of rows) {
        if (!Array.isArray(row) || row[0] !== "wrb.fr" || row[1] !== "Fbv4je" || typeof row[2] !== "string") continue;
        const payload: unknown = JSON.parse(row[2]);
        if (Array.isArray(payload) && payload[0] === "garturlres" && typeof payload[1] === "string") {
          return normalizeTrustedArticleUrl(payload[1], "ri");
        }
      }
    } catch { /* Ignore framing lines; reject if no valid destination is found. */ }
  }
  return null;
}

export async function resolveRotaryArticle(value: string, signal: AbortSignal): Promise<string> {
  const direct = normalizeTrustedArticleUrl(value, "ri");
  if (direct) return direct;
  const indexed = normalizeRotaryIndexUrl(value);
  if (!indexed) throw new Error("Invalid article URL");
  const indexRequest = new URL(indexed);
  indexRequest.searchParams.set("hl", "en-US");
  indexRequest.searchParams.set("gl", "US");
  indexRequest.searchParams.set("ceid", "US:en");
  const response = await fetch(indexRequest.toString(), { signal, redirect: "error", cache: "no-store" });
  if (!response.ok) throw new Error("Index unavailable");
  const html = await readResponseTextWithLimit(response, 1_000_000);
  const signature = html.match(/data-n-a-sg="([A-Za-z0-9_-]+)"/)?.[1];
  const timestamp = html.match(/data-n-a-ts="(\d+)"/)?.[1];
  if (!signature || !timestamp) throw new Error("Missing index destination");
  const id = new URL(indexed).pathname.split("/").pop();
  const payload = ["garturlreq", [["en-US", "US", ["FINANCE_TOP_INDICES", "WEB_TEST_1_0_0"], null, null, 1, 1, "US:en", null, 180, null, null, null, null, null, 0, null, null, [1608992183, 723341000]], "en-US", "US", 1, [2, 3, 4, 8], 1, 0, "655000234", 0, 0, null, 0], id, Number(timestamp), signature];
  const resolved = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je", {
    method: "POST", signal, redirect: "error", cache: "no-store",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ "f.req": JSON.stringify([[["Fbv4je", JSON.stringify(payload), null, "generic"]]]) }),
  });
  if (!resolved.ok) throw new Error("Resolution failed");
  const url = parseRotaryDestination(await readResponseTextWithLimit(resolved, 100_000));
  if (!url) throw new Error("Unapproved publisher destination");
  return url;
}
