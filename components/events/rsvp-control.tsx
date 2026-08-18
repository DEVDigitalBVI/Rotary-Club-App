"use client";

import { useState } from "react";
import { Check, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RsvpStatus } from "@/lib/mock-data";

const options: { value: Exclude<RsvpStatus, "none">; label: string; icon: typeof Check }[] = [
  { value: "yes", label: "Going", icon: Check },
  { value: "maybe", label: "Maybe", icon: HelpCircle },
  { value: "no", label: "Not going", icon: X },
];

export function RsvpControl({ initial }: { initial: RsvpStatus }) {
  const [status, setStatus] = useState<RsvpStatus>(initial);

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
              className={cn("font-heading", active && "shadow-sm")}
              onClick={() => setStatus(opt.value)}
            >
              <Icon />
              {opt.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
