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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Committee, Member } from "@/lib/mock-data";
import { assignCommitteeDirectorAction } from "@/app/(app)/directory/actions";

const VACANT = "vacant";

/**
 * Assigns or clears a committee's director. Assigning also seats the new
 * director on the committee's own roster (assign_committee_director does
 * this server-side), matching ManageCommitteeDialog's assumption that a
 * director always appears in their committee's member list.
 */
export function AssignDirectorDialog({
  committee,
  members,
  open,
  onOpenChange,
}: {
  committee: Committee | null;
  members: Member[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [value, setValue] = useState<string>(committee?.directorId ?? VACANT);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [seededFor, setSeededFor] = useState<string | null>(null);
  if (open && committee && seededFor !== committee.id) {
    setSeededFor(committee.id);
    setValue(committee.directorId ?? VACANT);
    setError(null);
  }

  if (!committee) return null;

  const sorted = [...members].sort((a, b) => a.name.localeCompare(b.name));

  function save() {
    if (!committee) return;
    setError(null);
    startTransition(async () => {
      const result = await assignCommitteeDirectorAction(
        committee.id,
        value === VACANT ? null : value
      );
      if (result?.error) {
        setError(result.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setSeededFor(null);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign director</DialogTitle>
          <DialogDescription>
            Who leads {committee.name}. They&apos;ll be added to the
            committee&apos;s roster automatically.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="assign-director">Director</Label>
          <Select value={value} onValueChange={(v) => setValue(v as string)}>
            <SelectTrigger id="assign-director" className="w-full">
              <SelectValue>
                {value === VACANT
                  ? "Vacant"
                  : sorted.find((m) => m.id === value)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={VACANT}>Vacant</SelectItem>
              {sorted.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" disabled={pending} className="font-heading" onClick={save}>
            {pending ? "Saving…" : "Save director"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
