"use client";

import { useState, useTransition } from "react";
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
import { updateNewsPostAction } from "@/app/(app)/news/actions";

/**
 * Lets a board member correct a club post after the fact — a wrong date, a
 * typo'd name, a detail that changed. Only club posts reach this dialog;
 * district and RI items are someone else's writing and aren't opened here.
 */
export function EditNewsDialog({
  post,
  open,
  onOpenChange,
}: {
  post: NewsPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Re-seed the edited fields from the post each time the dialog opens for
  // one, so an abandoned edit doesn't leak into the next post opened.
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("normal");
  const [isPinned, setIsPinned] = useState(false);
  const [requiresAcknowledgement, setRequiresAcknowledgement] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  if (open && post && seededFor !== post.id) {
    setSeededFor(post.id);
    setTitle(post.title);
    setBody(post.body);
    setPriority(post.priority ?? "normal");
    setIsPinned(Boolean(post.isPinned));
    setRequiresAcknowledgement(Boolean(post.requiresAcknowledgement));
    setExpiresAt(post.expiresAt ?? "");
    setError(null);
  }

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

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            startTransition(async () => {
              const result = await updateNewsPostAction(post.id, undefined, formData);
              if (result?.error) {
                setError(result.error);
              } else {
                onOpenChange(false);
              }
            });
          }}
        >
          {error && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-news-title">Title</Label>
            <Input
              id="edit-news-title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-news-priority">Priority</Label>
              <select id="edit-news-priority" name="priority" value={priority} onChange={(event) => setPriority(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-news-expires">Expires</Label>
              <Input id="edit-news-expires" name="expiresAt" type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="isPinned" checked={isPinned} onChange={(event) => setIsPinned(event.target.checked)} className="size-4 accent-primary" />Pin to the top</label>
            <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="requiresAcknowledgement" checked={requiresAcknowledgement} onChange={(event) => setRequiresAcknowledgement(event.target.checked)} className="size-4 accent-primary" />Require acknowledgement</label>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-news-body">Message</Label>
            <Textarea
              id="edit-news-body"
              name="body"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>
          <DialogFooter className="mt-2">
            <Button type="submit" disabled={pending} className="font-heading">
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
