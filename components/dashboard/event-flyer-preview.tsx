"use client";

import { Expand, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { EventFlyer } from "@/lib/mock-data";

export function EventFlyerPreview({
  flyer,
  eventTitle,
}: {
  flyer: EventFlyer;
  eventTitle: string;
}) {
  return (
    <Dialog>
      <DialogTrigger
        className="group relative mx-auto block w-full max-w-[14.5rem] cursor-zoom-in text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rotary-gold)] focus-visible:ring-offset-4 focus-visible:ring-offset-[#123b67] lg:max-w-none"
        aria-label={`Enlarge flyer for ${eventTitle}`}
      >
        <span className="absolute -inset-2 rotate-2 rounded-[1.35rem] border border-white/10 bg-white/8 shadow-2xl transition-transform duration-300 group-hover:rotate-3 group-hover:scale-[1.02]" />
        <span className="relative block overflow-hidden rounded-2xl border border-white/20 bg-white shadow-[0_24px_60px_-28px_rgba(0,0,0,.75)] transition-transform duration-300 group-hover:-translate-y-1">
          {/* Flyer URLs may be local or supplied by Supabase Storage. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flyer.url}
            alt={flyer.alt}
            className="aspect-[3/4] w-full object-cover"
          />
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-[#071b31]/95 via-[#071b31]/65 to-transparent px-4 pb-3 pt-10 text-xs font-bold text-white">
            Tap to enlarge
            <span className="flex size-8 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-transform group-hover:scale-110">
              <Expand className="size-4" />
            </span>
          </span>
        </span>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#071b31]/96 p-3 text-white shadow-2xl backdrop-blur-xl sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)] sm:max-w-5xl sm:p-5"
      >
        <DialogTitle className="sr-only">Flyer for {eventTitle}</DialogTitle>
        <DialogDescription className="sr-only">
          Enlarged event flyer. Press Escape or use the close button to return.
        </DialogDescription>
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-black/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flyer.url}
            alt={flyer.alt}
            className="max-h-full max-w-full object-contain"
          />
          <DialogClose
            className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close enlarged flyer"
          >
            <X className="size-5" />
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
