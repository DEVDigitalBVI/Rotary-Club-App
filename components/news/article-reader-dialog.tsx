"use client";

import { useEffect, useState } from "react";
import { BookOpen, ExternalLink, LoaderCircle, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { NewsSource } from "@/lib/mock-data";

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
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-5 py-7 sm:px-8 sm:py-10">
      {blocks.map((block, index) => {
        const images = [...block.matchAll(/!\[([^\]]*)\]\((https:\/\/[^)]+)\)/g)];
        if (images.length > 0) {
          return (
            <div key={index} className="grid gap-3">
              {images.map((imageMatch) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={imageMatch[2]} src={imageMatch[2]} alt={imageMatch[1]} className="w-full rounded-xl object-cover" />
              ))}
            </div>
          );
        }
        if (/^#{1,3}\s/.test(block)) {
          return <h2 key={index} className="font-heading text-xl font-semibold text-foreground">{cleanInlineMarkdown(block.replace(/^#{1,3}\s+/, ""))}</h2>;
        }
        const text = cleanInlineMarkdown(block);
        if (!text) return null;
        return <p key={index} className="whitespace-pre-line text-sm leading-7 text-foreground sm:text-base">{text}</p>;
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
  const destination = source === "district" ? "District 7020" : "Rotary.org";

  useEffect(() => {
    if (!open || source !== "district" || districtContent) return;
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    fetch(`/api/district-article?url=${encodeURIComponent(url)}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as { content?: string; error?: string };
        if (!response.ok || !result.content) throw new Error(result.error ?? "Unable to load story");
        setDistrictContent(result.content);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(error instanceof Error ? error.message : "Unable to load story");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [districtContent, open, source, url]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setLoading(source === "ri" || !districtContent);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        Read the full story
        <BookOpen className="size-3.5" />
      </button>

      <DialogContent
        showCloseButton={false}
        contentClassName="h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden"
        className="h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] gap-0 overflow-hidden rounded-[1.25rem] border-border bg-background p-0 sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)] sm:max-w-[calc(100%-2rem)] lg:max-w-6xl"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="font-label text-[0.52rem] text-primary/65">{publisher}</p>
            <DialogTitle className="mt-1 truncate font-heading text-base font-semibold sm:text-lg">
              {title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {publisher} article displayed inside the app.
            </DialogDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="hidden rounded-full sm:inline-flex"
            nativeButton={false}
            render={<a href={url} target="_blank" rel="noreferrer noopener" />}
          >
            Open on {destination} <ExternalLink className="size-3.5" />
          </Button>
          <DialogClose
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close article"
          >
            <X className="size-5" />
          </DialogClose>
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto bg-white">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background text-sm text-muted-foreground">
              <LoaderCircle className="size-6 animate-spin text-primary" />
              Loading story from {publisher}…
            </div>
          )}
          {loadError && source === "district" && !loading && (
            <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="text-sm text-muted-foreground">{loadError}</p>
              <Button variant="outline" nativeButton={false} render={<a href={url} target="_blank" rel="noreferrer noopener" />}>
                Open on District 7020 <ExternalLink className="size-4" />
              </Button>
            </div>
          )}
          {source === "district" && districtContent && <DistrictArticle content={districtContent} />}
          {open && source === "ri" && (
            <iframe
              src={url}
              title={`${title} — ${publisher}`}
              className="size-full border-0"
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setLoading(false)}
            />
          )}
        </div>

        <div className="flex shrink-0 border-t border-border bg-card p-3 sm:hidden">
          <Button className="w-full rounded-full" variant="outline" nativeButton={false} render={<a href={url} target="_blank" rel="noreferrer noopener" />}>
            Open on {destination} <ExternalLink className="size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
