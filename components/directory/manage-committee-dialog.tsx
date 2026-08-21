"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Plus, Search } from "lucide-react";
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
import { MemberAvatar } from "@/components/member-avatar";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import type {
  Committee,
  CommitteeManageRight,
  Member,
} from "@/lib/mock-data";
import { updateCommitteeRosterAction } from "@/app/(app)/directory/actions";

/**
 * Roster editor for a single committee. Deliberately a toggle list rather than
 * a search-and-invite flow: a director is picking from a club of a few dozen
 * people they already know, so showing everyone and letting them tap is faster
 * than making them recall and type names.
 */
export function ManageCommitteeDialog({
  committee,
  members,
  manageRight,
  open,
  onOpenChange,
}: {
  committee: Committee | null;
  members: Member[];
  manageRight: CommitteeManageRight;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Re-seed from the committee each time the dialog is opened for one, so an
  // abandoned edit doesn't leak into the next committee the director opens.
  const [seededFor, setSeededFor] = useState<string | null>(null);
  if (open && committee && seededFor !== committee.id) {
    setSeededFor(committee.id);
    setSelected(committee.memberIds);
    setQuery("");
    setError(null);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(q) ||
        member.classification.toLowerCase().includes(q)
    );
  }, [members, query]);

  if (!committee) return null;

  const director = committee.directorId
    ? members.find((member) => member.id === committee.directorId)
    : undefined;
  // An officer editing someone else's committee is overriding, not doing their
  // own housekeeping. Say so, so it is a deliberate act rather than a slip.
  const isOverride = manageRight === "officer" && Boolean(director);

  function toggle(memberId: string) {
    // The director sits on their own committee by definition — removing them
    // would leave it without a leader, so that row isn't a toggle.
    if (memberId === committee?.directorId) return;
    setSelected((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setSeededFor(null);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage {committee.name}</DialogTitle>
          <DialogDescription>
            {isOverride
              ? `You're editing this as a club officer — ${director?.name} directs this committee.`
              : committee.managedBy === "officers"
                ? "Board membership follows from holding office. Only the President and Secretary can change it."
                : "Add or remove members of your committee. Members can see who serves on it."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {selected.length} of {members.length} members selected
        </p>

        <ul className="-mx-1 flex max-h-80 flex-col overflow-y-auto px-1">
          {filtered.map((member) => {
            const isDirector = member.id === committee.directorId;
            const isOn = selected.includes(member.id);
            return (
              <li key={member.id}>
                <button
                  type="button"
                  disabled={isDirector}
                  onClick={() => toggle(member.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
                    isDirector
                      ? "cursor-default opacity-90"
                      : "hover:bg-muted"
                  )}
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
                    <p className="truncate text-xs text-muted-foreground">
                      {member.classification}
                    </p>
                  </div>
                  {isDirector ? (
                    <StatusBadge tone="gold">Director</StatusBadge>
                  ) : (
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors",
                        isOn
                          ? "border-transparent bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground"
                      )}
                      aria-hidden="true"
                    >
                      {isOn ? (
                        <Check className="size-4" />
                      ) : (
                        <Plus className="size-4" />
                      )}
                    </span>
                  )}
                  <span className="sr-only">
                    {isDirector
                      ? "Committee director"
                      : isOn
                        ? "Remove from committee"
                        : "Add to committee"}
                  </span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="py-8 text-center text-sm text-muted-foreground">
              No members match your search.
            </li>
          )}
        </ul>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            disabled={pending}
            className="font-heading"
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await updateCommitteeRosterAction(
                  committee.id,
                  committee.memberIds,
                  selected
                );
                if (result?.error) {
                  setError(result.error);
                } else {
                  onOpenChange(false);
                }
              });
            }}
          >
            {pending ? "Saving…" : "Save committee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
