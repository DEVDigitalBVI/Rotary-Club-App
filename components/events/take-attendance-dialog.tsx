"use client";

import { useState, useTransition } from "react";
import { Check, ClipboardCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/member-avatar";
import { cn } from "@/lib/utils";
import type { Member } from "@/lib/mock-data";
import { saveEventAttendanceAction } from "@/app/(app)/events/actions";

export function TakeAttendanceDialog({
  eventId,
  members,
  attendeeIds,
}: {
  eventId: string;
  members: Member[];
  attendeeIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(attendeeIds);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(memberId: string) {
    setSelected((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setSelected(attendeeIds);
          setError(null);
        }
      }}
    >
      <Button
        variant="outline"
        size="sm"
        className="font-heading w-full"
        onClick={() => setOpen(true)}
      >
        <ClipboardCheck />
        Take attendance
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Take attendance</DialogTitle>
          <DialogDescription>
            {selected.length} of {members.length} marked present. Counts
            toward the bylaws&apos; 50%-attendance requirement.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <ul className="-mx-1 flex max-h-80 flex-col overflow-y-auto px-1">
          {members.map((member) => {
            const isOn = selected.includes(member.id);
            return (
              <li key={member.id}>
                <button
                  type="button"
                  onClick={() => toggle(member.id)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
                >
                  <MemberAvatar
                    member={member}
                    className="size-9 shrink-0"
                    fallbackClassName="text-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-heading truncate text-sm font-medium text-foreground">
                      {member.name}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isOn
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground"
                    )}
                    aria-hidden="true"
                  >
                    {isOn && <Check className="size-4" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            disabled={pending}
            className="font-heading"
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await saveEventAttendanceAction(
                  eventId,
                  attendeeIds,
                  selected
                );
                if (result?.error) {
                  setError(result.error);
                } else {
                  setOpen(false);
                }
              });
            }}
          >
            {pending ? "Saving…" : "Save attendance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
