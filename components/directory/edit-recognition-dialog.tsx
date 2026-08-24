"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Minus, Plus, Search, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  actionGroupsByArea,
  paulHarrisLabel,
  type FoundationRecognition,
  type Member,
} from "@/lib/mock-data";
import { updateRecognitionAction } from "@/app/(app)/directory/actions";

/**
 * PHF+8 is the top Paul Harris level — a total of nine recognitions. Beyond it
 * a member becomes a Major Donor, which is a different recognition entirely
 * and not something this field should try to express.
 */
const MAX_PAUL_HARRIS = 9;

export function EditRecognitionDialog({
  member,
  recognition,
  open,
  onOpenChange,
}: {
  member: Member;
  recognition: FoundationRecognition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [draft, setDraft] = useState(recognition);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [groupQuery, setGroupQuery] = useState("");

  // Re-seed whenever the dialog is reopened, so a cancelled edit is discarded.
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setDraft(recognition);
    setError(null);
    setGroupQuery("");
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  function setCount(next: number) {
    setDraft((prev) => ({
      ...prev,
      paulHarrisCount: Math.min(MAX_PAUL_HARRIS, Math.max(0, next)),
    }));
  }

  function toggleActionGroup(group: string) {
    setDraft((prev) => ({
      ...prev,
      actionGroups: prev.actionGroups.includes(group)
        ? prev.actionGroups.filter((g) => g !== group)
        : [...prev.actionGroups, group],
    }));
  }

  // 27 groups across eight areas is too many to show as a flat wall of chips,
  // so they stay grouped by area of focus and the search narrows in. Areas with
  // no match drop out entirely rather than leaving empty headings behind.
  const visibleAreas = useMemo(() => {
    const q = groupQuery.trim().toLowerCase();
    return actionGroupsByArea
      .map((entry) => ({
        area: entry.area,
        groups: q
          ? entry.groups.filter((group) => group.toLowerCase().includes(q))
          : entry.groups,
      }))
      .filter((entry) => entry.groups.length > 0);
  }, [groupQuery]);

  const countLabel =
    paulHarrisLabel(draft.paulHarrisCount) ?? "Not yet a Paul Harris Fellow";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Foundation recognition</DialogTitle>
          <DialogDescription>
            Recorded for {member.name} by the Secretary and the Foundation
            director. Members can see this but can&apos;t change it.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Label>Paul Harris Fellow</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="One fewer recognition"
                  disabled={draft.paulHarrisCount === 0}
                  onClick={() => setCount(draft.paulHarrisCount - 1)}
                >
                  <Minus />
                </Button>
                <p
                  aria-live="polite"
                  className="flex-1 text-center text-sm font-medium text-foreground"
                >
                  {countLabel}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="One more recognition"
                  disabled={draft.paulHarrisCount === MAX_PAUL_HARRIS}
                  onClick={() => setCount(draft.paulHarrisCount + 1)}
                >
                  <Plus />
                </Button>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  polioPlusSociety: !prev.polioPlusSociety,
                }))
              }
              aria-pressed={draft.polioPlusSociety}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted"
            >
              <span>
                <span className="font-heading block text-sm font-medium text-foreground">
                  PolioPlus Society
                </span>
                <span className="text-xs text-muted-foreground">
                  Commits to an annual gift to PolioPlus.
                </span>
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors",
                  draft.polioPlusSociety
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                )}
              >
                {draft.polioPlusSociety && <Check className="size-4" />}
              </span>
            </button>

            <div className="flex flex-col gap-2">
              <Label htmlFor="action-group-search">Rotary Action Groups</Label>

              {/* Current selections stay visible above the search, so they
                  can be removed without hunting for them in the list. */}
              {draft.actionGroups.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {draft.actionGroups.map((group) => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => toggleActionGroup(group)}
                      className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground"
                    >
                      {group}
                      <X className="size-3" />
                      <span className="sr-only">Remove</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="action-group-search"
                  placeholder="Search 27 action groups"
                  value={groupQuery}
                  onChange={(e) => setGroupQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="max-h-64 overflow-y-auto rounded-lg border border-border p-3">
                {visibleAreas.map((entry) => (
                  // A rule plus generous space above each heading, so the areas
                  // read as separate sections rather than one run of chips.
                  <div
                    key={entry.area}
                    className="mt-4 border-t border-border pt-4 first:mt-0 first:border-t-0 first:pt-0"
                  >
                    <p className="font-heading px-0.5 pb-2 text-[0.7rem] text-foreground">
                      {entry.area}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.groups.map((group) => {
                        const on = draft.actionGroups.includes(group);
                        return (
                          <button
                            key={group}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggleActionGroup(group)}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs transition-colors",
                              on
                                ? "border-transparent bg-primary text-primary-foreground"
                                : "border-border text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {group}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {visibleAreas.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No action groups match your search.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                disabled={pending}
                className="font-heading"
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const result = await updateRecognitionAction(member.id, draft);
                    if (result?.error) {
                      setError(result.error);
                    } else {
                      onOpenChange(false);
                    }
                  });
                }}
              >
                {pending ? "Saving…" : "Save recognition"}
              </Button>
            </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
