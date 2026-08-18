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

export function CreateEventDialog() {
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
        Create event
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create event</DialogTitle>
          <DialogDescription>
            Members will see this on their Events tab right away.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <p className="rounded-lg bg-muted p-3 text-sm text-foreground">
            This is a design preview — events aren&apos;t saved yet.
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
              <Label htmlFor="event-title">Title</Label>
              <Input id="event-title" placeholder="Weekly Club Meeting" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-date">Date</Label>
                <Input id="event-date" type="date" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-time">Time</Label>
                <Input id="event-time" type="time" required />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-location">Location or link</Label>
              <Input id="event-location" placeholder="Peebles Hospitality Centre" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-description">Description</Label>
              <Textarea id="event-description" rows={3} />
            </div>
            <DialogFooter className="mt-2">
              <Button type="submit" className="font-heading">
                Publish event
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
