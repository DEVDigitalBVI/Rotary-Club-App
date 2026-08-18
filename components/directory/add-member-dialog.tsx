"use client";

import { useState } from "react";
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

export function AddMemberDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setSubmitted(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a member</DialogTitle>
          <DialogDescription>
            They&apos;ll receive an email invite to set up their login.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <p className="rounded-lg bg-muted p-3 text-sm text-foreground">
            Invite queued. This is a design preview — member records aren&apos;t
            saved yet.
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
              <Label htmlFor="new-member-name">Full name</Label>
              <Input id="new-member-name" placeholder="Jane Smith" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-member-email">Email</Label>
              <Input
                id="new-member-email"
                type="email"
                placeholder="jane.smith@example.com"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-member-classification">Classification</Label>
              <Input
                id="new-member-classification"
                placeholder="e.g. Marine Biology"
              />
            </div>
            <DialogFooter className="mt-2">
              <Button type="submit" className="font-heading">
                Send invite
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
