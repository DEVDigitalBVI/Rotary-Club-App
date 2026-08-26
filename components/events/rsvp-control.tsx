"use client";

import { useState, useTransition } from "react";
import { Check, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RsvpStatus } from "@/lib/mock-data";
import { updateRsvpAction } from "@/app/(app)/events/actions";

const options: { value: Exclude<RsvpStatus, "none">; label: string; icon: typeof Check }[] = [
  { value: "yes", label: "Going", icon: Check },
  { value: "maybe", label: "Maybe", icon: HelpCircle },
  { value: "no", label: "Not going", icon: X },
];

export function RsvpControl({
  eventId,
  initial,
  allowGuests = false,
  dietaryNotesEnabled = false,
  initialGuestCount = 0,
  initialDietaryNotes = "",
  registrationStatus,
}: {
  eventId: string;
  initial: RsvpStatus;
  allowGuests?: boolean;
  dietaryNotesEnabled?: boolean;
  initialGuestCount?: number;
  initialDietaryNotes?: string;
  registrationStatus?: "registered" | "waitlisted";
}) {
  const [status, setStatus] = useState<RsvpStatus>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [guestCount, setGuestCount] = useState(initialGuestCount);
  const [dietaryNotes, setDietaryNotes] = useState(initialDietaryNotes);
  const [saved, setSaved] = useState(false);

  function choose(value: Exclude<RsvpStatus, "none">) {
    const previous = status;
    setStatus(value);
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateRsvpAction(eventId, value, { guestCount, dietaryNotes });
      if (result?.error) {
        setStatus(previous);
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">Your RSVP</p>
      <div className="flex gap-2">
        {options.map((opt) => {
          const active = status === opt.value;
          const Icon = opt.icon;
          return (
            <Button
              key={opt.value}
              variant={active ? "default" : "outline"}
              disabled={pending}
              className={cn("font-heading", active && "shadow-sm")}
              onClick={() => choose(opt.value)}
            >
              <Icon />
              {opt.label}
            </Button>
          );
        })}
      </div>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      {status === "yes" && registrationStatus === "waitlisted" && <p className="rounded-lg bg-secondary/20 p-2 text-xs text-foreground">You’re currently on the waitlist.</p>}
      {status === "yes" && (allowGuests || dietaryNotesEnabled) && (
        <div className="mt-2 grid gap-3 rounded-xl border border-border bg-muted/25 p-4 sm:grid-cols-2">
          {allowGuests && <label className="text-xs font-medium text-muted-foreground">Guests<input type="number" min="0" max="10" value={guestCount} onChange={(event) => { setGuestCount(Number(event.target.value)); setSaved(false); }} className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground" /></label>}
          {dietaryNotesEnabled && <label className="text-xs font-medium text-muted-foreground">Dietary requirements<input value={dietaryNotes} onChange={(event) => { setDietaryNotes(event.target.value); setSaved(false); }} placeholder="Optional" className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground" /></label>}
          <Button type="button" variant="secondary" disabled={pending} className="sm:col-span-2" onClick={() => choose("yes")}>{pending ? "Saving…" : "SAVE RSVP"}</Button>
          {saved && <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary sm:col-span-2"><Check className="size-3.5" />RSVP saved</p>}
        </div>
      )}
    </div>
  );
}
