"use client";

import { useEffect, useState } from "react";
import { BookOpen, LoaderCircle, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { NewsSource } from "@/lib/club";
import { normalizeTrustedArticleUrl, normalizeRotaryIndexUrl } from "@/lib/security/news-urls";

function cleanInlineMarkdown(value: string) {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();
}

function DistrictArticle({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-5 overflow-x-hidden px-4 py-6 pb-10 sm:gap-6 sm:px-8 sm:py-10">
      {blocks.map((block, index) => {
        const images = [...block.matchAll(/!\[([^\]]*)\]\((https:\/\/[^)]+)\)/g)];
        if (images.length > 0) {
          return (
            <figure key={index} className="-mx-4 grid gap-3 sm:mx-0">
              {images.map((imageMatch) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={imageMatch[2]}
                  src={imageMatch[2]}
                  alt={imageMatch[1]}
                  loading="lazy"
                  className="max-h-[70dvh] w-full bg-muted object-contain sm:rounded-xl"
                />
              ))}
            </figure>
          );
        }
        if (/^#{1,3}\s/.test(block)) {
          return <h2 key={index} className="break-words font-heading text-xl font-semibold leading-tight text-foreground sm:text-2xl">{cleanInlineMarkdown(block.replace(/^#{1,3}\s+/, ""))}</h2>;
        }
        const text = cleanInlineMarkdown(block);
        if (!text) return null;
        return <p key={index} className="break-words whitespace-pre-line text-[0.9375rem] leading-7 text-foreground sm:text-base sm:leading-8">{text}</p>;
      })}
    </article>
  );
}

export function ArticleReaderDialog({
  title,
  url,
  source,
}: {
  title: string;
  url: string;
  source: Exclude<NewsSource, "club">;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [districtContent, setDistrictContent] = useState("");
  const [loadError, setLoadError] = useState("");
  const publisher = source === "district" ? "District 7020" : "Rotary International";
  const trustedUrl = normalizeTrustedArticleUrl(url, source);
  const indexedUrl = source === "ri" ? normalizeRotaryIndexUrl(url) : null;
  const requestUrl = trustedUrl ?? indexedUrl;
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!open || (source === "district" ? districtContent : resolvedUrl)) return;
    if (!requestUrl) return;
    const controller = new AbortController();
    fetch(`/api/${source === "district" ? "district" : "rotary"}-article?url=${encodeURIComponent(requestUrl)}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as { content?: string; url?: string; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to load story");
        if (source === "district" && result.content) setDistrictContent(result.content);
        else if (source === "ri" && result.url) {
          const destination = normalizeTrustedArticleUrl(result.url, "ri");
          if (!destination) throw new Error("Unapproved article destination");
          setResolvedUrl(destination);
        } else throw new Error("Unable to load story");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(error instanceof Error ? error.message : "Unable to load story");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [districtContent, open, source, requestUrl, resolvedUrl, retry]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setLoading(Boolean(requestUrl) && !(source === "district" ? districtContent : resolvedUrl));
          setLoadError("");
        }
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        Read the full story
        <BookOpen className="size-3.5" />
      </button>

      <DialogContent
        showCloseButton={false}
        contentClassName="h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden"
        className="inset-0 h-[100dvh] max-h-none max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-0 bg-background p-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)] sm:max-w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.25rem] sm:border sm:border-border lg:max-w-6xl"
      >
        <header className="flex shrink-0 items-start gap-3 border-b border-border bg-card px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 sm:items-center sm:px-5 sm:py-3">
          <div className="min-w-0 flex-1">
            <p className="font-label text-[0.52rem] text-primary/65">{publisher}</p>
            <DialogTitle className="mt-1 line-clamp-2 break-words font-heading text-base font-semibold leading-snug sm:truncate sm:text-lg">
              {title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {publisher} article displayed inside the app.
            </DialogDescription>
          </div>
          <DialogClose
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-10"
            aria-label="Close article"
          >
            <X className="size-5" />
          </DialogClose>
        </header>

        <div className="relative min-h-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain bg-white [-webkit-overflow-scrolling:touch]">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background text-sm text-muted-foreground">
              <LoaderCircle className="size-6 animate-spin text-primary" />
              Loading story from {publisher}…
            </div>
          )}
          {(loadError || !requestUrl) && !loading && (
            <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="text-sm text-muted-foreground">
                {loadError || "This article link is not from an approved publisher."}
              </p>
              {requestUrl && <Button variant="outline" onClick={() => { setLoadError(""); setLoading(true); setRetry(value => value + 1); }}>Try again</Button>}
            </div>
          )}
          {source === "district" && districtContent && <DistrictArticle content={districtContent} />}
          {open && source === "ri" && resolvedUrl && (
            <iframe
              src={resolvedUrl}
              title={`${title} — ${publisher}`}
              className="size-full border-0"
              sandbox="allow-forms allow-scripts"
              referrerPolicy="no-referrer"
              onLoad={() => setLoading(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
