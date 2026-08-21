"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PostAnnouncementDialog() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photo, setPhoto] = useState<{ name: string; url: string } | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url = photo?.url;
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSubmitted(false);
          setPhoto(null);
        }
      }}
    >
      <Button className="font-heading" onClick={() => setOpen(true)}>
        <Plus />
        Post announcement
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Post a club announcement</DialogTitle>
          <DialogDescription>
            Appears at the top of every member&apos;s News feed.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <p className="rounded-lg bg-muted p-3 text-sm text-foreground">
            This is a design preview — the post isn&apos;t published yet.
          </p>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="news-title">Title</Label>
              <Input id="news-title" placeholder="Reminder about Sunday's cleanup" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="news-body">Message</Label>
              <Textarea id="news-body" rows={4} required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Photo</Label>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPhoto({ name: file.name, url: URL.createObjectURL(file) });
                  e.target.value = "";
                }}
              />
              {photo ? (
                <div className="flex items-center gap-3 rounded-lg border border-border p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt=""
                    aria-hidden="true"
                    className="aspect-[16/9] w-24 shrink-0 rounded-md border border-border object-cover"
                  />
                  <p className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {photo.name}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Change photo"
                    onClick={() => photoRef.current?.click()}
                  >
                    <Upload />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove photo"
                    className="text-muted-foreground"
                    onClick={() => setPhoto(null)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-6 text-center transition-colors hover:bg-muted"
                >
                  <ImageIcon className="size-5 text-muted-foreground" />
                  <span className="font-heading text-sm font-medium text-foreground">
                    Add photo
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Optional — shown at the top of the post
                  </span>
                </button>
              )}
            </div>
            <DialogFooter className="mt-2">
              <Button type="submit" className="font-heading">
                Post
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
