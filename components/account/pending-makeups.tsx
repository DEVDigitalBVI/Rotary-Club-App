"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { MakeupEntry } from "@/lib/data/attendance";
import { markMakeupClubrunnerLoggedAction } from "@/app/(app)/account/actions";

export function PendingMakeups({ makeups }: { makeups: MakeupEntry[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-semibold text-foreground">
            Makeups pending ClubRunner entry
          </h3>
          {makeups.length > 0 && (
            <span className="text-xs text-muted-foreground">{makeups.length}</span>
          )}
        </div>
        {makeups.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">All caught up.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {makeups.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {m.memberName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.clubOrEvent} · {formatDate(m.attendedOn)}
                  </p>
                  {m.notes && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{m.notes}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="font-heading shrink-0"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await markMakeupClubrunnerLoggedAction(m.id);
                    })
                  }
                >
                  <Check />
                  Logged
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
