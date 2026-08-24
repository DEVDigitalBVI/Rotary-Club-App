"use client";

import { useState } from "react";
import { BookOpen, ExternalLink, LoaderCircle, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ArticleReaderDialog({ title, url }: { title: string; url: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setLoading(true);
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
            <p className="font-label text-[0.52rem] text-primary/65">Rotary International</p>
            <DialogTitle className="mt-1 truncate font-heading text-base font-semibold sm:text-lg">
              {title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Rotary International article displayed inside the app.
            </DialogDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="hidden rounded-full sm:inline-flex"
            nativeButton={false}
            render={<a href={url} target="_blank" rel="noreferrer noopener" />}
          >
            Open on Rotary.org <ExternalLink className="size-3.5" />
          </Button>
          <DialogClose
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close article"
          >
            <X className="size-5" />
          </DialogClose>
        </header>

        <div className="relative min-h-0 flex-1 bg-white">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background text-sm text-muted-foreground">
              <LoaderCircle className="size-6 animate-spin text-primary" />
              Loading story from Rotary International…
            </div>
          )}
          {open && (
            <iframe
              src={url}
              title={`${title} — Rotary International`}
              className="size-full border-0"
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setLoading(false)}
            />
          )}
        </div>

        <div className="flex shrink-0 border-t border-border bg-card p-3 sm:hidden">
          <Button className="w-full rounded-full" variant="outline" nativeButton={false} render={<a href={url} target="_blank" rel="noreferrer noopener" />}>
            Open on Rotary.org <ExternalLink className="size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
