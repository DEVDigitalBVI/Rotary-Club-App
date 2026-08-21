"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Trash2, Upload } from "lucide-react";
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
import type { NewsPost } from "@/lib/mock-data";

/**
 * Lets a board member correct a club post after the fact — a wrong date, a
 * typo'd name, a detail that changed. Only club posts reach this dialog;
 * district and RI items are someone else's writing and aren't opened here.
 */
export function EditNewsDialog({
  post,
  open,
  onOpenChange,
  onSave,
}: {
  post: NewsPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: { title: string; body: string; photo: { name: string; url: string } | null }) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<{ name: string; url: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  // Re-seed from the post each time the dialog is opened for one, so an
  // abandoned edit doesn't leak into the next post a board member opens.
  const [seededFor, setSeededFor] = useState<string | null>(null);
  if (open && post && seededFor !== post.id) {
    setSeededFor(post.id);
    setTitle(post.title);
    setBody(post.body);
    setPhoto(post.image ? { name: post.image.alt, url: post.image.url } : null);
    setSaved(false);
  }

  useEffect(() => {
    const url = photo?.url;
    if (!url || url === post?.image?.url) return;
    return () => URL.revokeObjectURL(url);
  }, [photo, post]);

  if (!post) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setSeededFor(null);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit post</DialogTitle>
          <DialogDescription>
            Correcting inaccurate or outdated information in a club post.
          </DialogDescription>
        </DialogHeader>

        {saved ? (
          <p className="rounded-lg bg-muted p-3 text-sm text-foreground">
            This is a design preview — changes aren&apos;t saved yet.
          </p>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              onSave({ title, body, photo });
              setSaved(true);
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-news-title">Title</Label>
              <Input
                id="edit-news-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-news-body">Message</Label>
              <Textarea
                id="edit-news-body"
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
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
                Save changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
