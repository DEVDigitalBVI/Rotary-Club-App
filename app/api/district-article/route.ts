const DISTRICT_HOST = "7020.org";

function validDistrictStory(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname.replace(/^www\./, "") === DISTRICT_HOST &&
      /^\/stories\//i.test(url.pathname);
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const sourceUrl = new URL(request.url).searchParams.get("url") ?? "";
  if (!validDistrictStory(sourceUrl)) {
    return Response.json({ error: "Invalid District 7020 story URL." }, { status: 400 });
  }

  const source = new URL(sourceUrl);
  const readerUrl = `https://r.jina.ai/http://www.7020.org${source.pathname}${source.search}`;
  try {
    const response = await fetch(readerUrl, {
      cache: "force-cache",
      next: { revalidate: 60 * 60 * 6, tags: ["district-7020-articles"] },
    });
    if (!response.ok) throw new Error("Reader request failed");
    const rendered = await response.text();
    const content = rendered.split("Markdown Content:")[1]?.trim() ?? "";
    if (!content) throw new Error("Reader returned no article content");
    return Response.json({ content });
  } catch {
    return Response.json({ error: "This District 7020 story could not be loaded." }, { status: 502 });
  }
}
