"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { postNewsAction } from "@/app/(app)/news/actions";

export function PostAnnouncementDialog({ committees, events }: { committees: { id: string; name: string }[]; events: { id: string; title: string }[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setError(null);
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

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            startTransition(async () => {
              const result = await postNewsAction(undefined, formData);
              if (result?.error) {
                setError(result.error);
              } else {
                setOpen(false);
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
            <Label htmlFor="news-title">Title</Label>
            <Input
              id="news-title"
              name="title"
              placeholder="Reminder about Sunday's cleanup"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="news-body">Message</Label>
            <Textarea id="news-body" name="body" rows={4} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="news-audience">Audience</Label>
            <Select name="audienceType" defaultValue="all">
              <SelectTrigger id="news-audience"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All members</SelectItem><SelectItem value="board">Board only</SelectItem><SelectItem value="committee">A committee</SelectItem><SelectItem value="event">Event attendees</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="news-audience-id">Committee or event</Label>
            <select id="news-audience-id" name="audienceId" className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
              <option value="">Not needed for all members or board</option>
              <optgroup label="Committees">{committees.map((committee) => <option key={committee.id} value={committee.id}>{committee.name}</option>)}</optgroup>
              <optgroup label="Events">{events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</optgroup>
            </select>
          </div>
          <DialogFooter className="mt-2">
            <Button type="submit" disabled={pending} className="font-heading">
              {pending ? "Posting…" : "Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
