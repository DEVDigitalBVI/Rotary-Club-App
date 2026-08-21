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
import { addMemberAction } from "@/app/(app)/directory/actions";

export function AddMemberDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) setError(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a member</DialogTitle>
          <DialogDescription>
            They can sign up at /signup with this email once they&apos;re on
            the roster.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            startTransition(async () => {
              const result = await addMemberAction(undefined, formData);
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
            <Label htmlFor="new-member-name">Full name</Label>
            <Input id="new-member-name" name="name" placeholder="Jane Smith" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-member-email">Email</Label>
            <Input
              id="new-member-email"
              name="email"
              type="email"
              placeholder="jane.smith@example.com"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-member-classification">Classification</Label>
            <Input
              id="new-member-classification"
              name="classification"
              placeholder="e.g. Marine Biology"
            />
          </div>
          <DialogFooter className="mt-2">
            <Button type="submit" disabled={pending} className="font-heading">
              {pending ? "Adding…" : "Add member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
