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
import type { Member } from "@/lib/mock-data";
import { startNewRotaryYearAction } from "@/app/(app)/directory/actions";

/**
 * The manual annual handover. What it will do is computed here from the
 * roster already on the page, so the confirmation names names rather than
 * describing the rule abstractly.
 */
export function StartNewRotaryYearDialog({
  members,
  open,
  onOpenChange,
}: {
  members: Member[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const outgoingPresident = members.find((m) => m.position === "president");
  const outgoingSecretary = members.find((m) => m.position === "secretary");
  const incomingPresident = members.find((m) => m.position === "president-elect");
  const incomingSecretary = members.find((m) => m.position === "secretary-elect");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Start new Rotary year</DialogTitle>
          <DialogDescription>This can&apos;t be undone from here.</DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <ul className="flex flex-col gap-2 text-sm text-foreground">
          <li>
            <span className="font-medium">President:</span>{" "}
            {incomingPresident ? incomingPresident.name : "stays vacant"}
            {outgoingPresident && ` (was ${outgoingPresident.name})`}
          </li>
          <li>
            <span className="font-medium">Secretary:</span>{" "}
            {incomingSecretary ? incomingSecretary.name : "stays vacant"}
            {outgoingSecretary && ` (was ${outgoingSecretary.name})`}
          </li>
          <li>
            <span className="font-medium">Committee chats:</span>{" "}
            archive this year&apos;s rooms and open new rooms for the current rosters
          </li>
        </ul>
        {!incomingPresident && !incomingSecretary && (
          <p className="text-xs text-muted-foreground">
            No President-Elect or Secretary-Elect is on file — both seats will
            just go vacant until you assign them by hand.
          </p>
        )}

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            className="font-heading"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={pending}
            className="font-heading"
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await startNewRotaryYearAction();
                if (result?.error) {
                  setError(result.error);
                } else {
                  onOpenChange(false);
                }
              });
            }}
          >
            {pending ? "Starting…" : "Start new year"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
