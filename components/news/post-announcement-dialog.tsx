"use client";

import { useState } from "react";
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

export function PostAnnouncementDialog() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSubmitted(false);
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
