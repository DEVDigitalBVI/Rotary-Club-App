"use client";

import { useEffect, useState } from "react";
import { CircleAlert, RefreshCw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Provenance for everything on the account screen. The numbers here are
 * QuickBooks', not the app's, so a member looking at a balance needs to know
 * how fresh it is — a silently stale figure is worse than no figure, because
 * they'll act on it.
 */
export function SyncStatus({
  lastSyncedAt,
  status,
  className,
}: {
  lastSyncedAt: string;
  status: "ok" | "stale" | "disconnected";
  className?: string;
}) {
  // Relative time is computed from the client's clock, so it can't be part of
  // the server render without the two disagreeing at hydration. The label
  // appears once mounted; until then the row still says where the data is from.
  const [relative, setRelative] = useState<string | null>(null);

  useEffect(() => {
    function tick() {
      setRelative(relativeTime(lastSyncedAt));
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [lastSyncedAt]);

  if (status === "disconnected") {
    return (
      <p className={cn("flex items-center gap-1.5 text-xs text-destructive", className)}>
        <CircleAlert className="size-3.5 shrink-0" />
        Not connected to QuickBooks — balances may be out of date.
      </p>
    );
  }

  const stale = status === "stale";

  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-xs",
        stale ? "text-secondary-foreground" : "text-muted-foreground",
        className
      )}
    >
      {stale ? (
        <TriangleAlert className="size-3.5 shrink-0" />
      ) : (
        <RefreshCw className="size-3.5 shrink-0" />
      )}
      <span>
        {stale ? "Last synced from QuickBooks" : "Synced from QuickBooks"}
        {relative ? ` · ${relative}` : ""}
      </span>
    </p>
  );
}

function relativeTime(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} ${plural(minutes, "minute")} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${plural(hours, "hour")} ago`;
  const days = Math.round(hours / 24);
  return `${days} ${plural(days, "day")} ago`;
}

function plural(count: number, word: string) {
  return count === 1 ? word : `${word}s`;
}
