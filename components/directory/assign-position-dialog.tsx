"use client";

import { useState, useTransition } from "react";
import { Landmark } from "lucide-react";
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
import { isPresident, positionLabel, type ClubPosition, type Member } from "@/lib/mock-data";
import { assignMemberPositionAction } from "@/app/(app)/directory/actions";

const NONE = "none";

const ELECT_POSITIONS: ClubPosition[] = ["president-elect", "secretary-elect"];
const ASSIGNABLE_POSITIONS: ClubPosition[] = [
  "president",
  "president-elect",
  "secretary",
  "secretary-elect",
  "treasurer",
];

/**
 * Assigns or clears a member's elected position. Only the President may set
 * or clear President-Elect/Secretary-Elect — see assign_member_position()'s
 * touches_elect rule — so this locks entirely for a member who currently
 * holds one of those, unless the viewer is the President.
 */
export function AssignPositionDialog({
  member,
  viewer,
}: {
  member: Member;
  viewer: Member;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>(member.position ?? NONE);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const viewerIsPresident = isPresident(viewer);
  const memberHoldsElect = ELECT_POSITIONS.includes(member.position as ClubPosition);
  const locked = memberHoldsElect && !viewerIsPresident;

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await assignMemberPositionAction(
        member.id,
        value === NONE ? null : value
      );
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setValue(member.position ?? NONE);
          setError(null);
        }
      }}
    >
      <Button
        variant="outline"
        className="font-heading h-auto max-w-full shrink whitespace-normal py-2.5 text-center leading-snug"
        disabled={locked}
        onClick={() => setOpen(true)}
      >
        <Landmark />
        {locked ? "Only the President can reassign this" : "Assign role"}
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign role</DialogTitle>
          <DialogDescription>
            {member.name}&apos;s elected position on the board.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="assign-position">Position</Label>
          <Select value={value} onValueChange={(v) => setValue(v as string)}>
            <SelectTrigger id="assign-position" className="w-full">
              <SelectValue>
                {value === NONE ? "No position" : positionLabel(value as ClubPosition)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>No position</SelectItem>
              {ASSIGNABLE_POSITIONS.map((position) => {
                const isElect = ELECT_POSITIONS.includes(position);
                return (
                  <SelectItem
                    key={position}
                    value={position}
                    disabled={isElect && !viewerIsPresident}
                  >
                    {positionLabel(position)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {!viewerIsPresident && (
            <p className="text-xs text-muted-foreground">
              Only the President can name a President-Elect or Secretary-Elect.
            </p>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" disabled={pending} className="font-heading" onClick={save}>
            {pending ? "Saving…" : "Save role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
