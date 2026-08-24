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
  memberId,
  initial,
}: {
  eventId: string;
  memberId: string;
  initial: RsvpStatus;
}) {
  const [status, setStatus] = useState<RsvpStatus>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(value: Exclude<RsvpStatus, "none">) {
    const previous = status;
    setStatus(value);
    setError(null);
    startTransition(async () => {
      const result = await updateRsvpAction(eventId, memberId, value);
      if (result?.error) {
        setStatus(previous);
        setError(result.error);
      }
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
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
