"use client";

import { useState, useTransition } from "react";
import { Check, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acknowledgeNewsPostAction } from "@/app/(app)/news/actions";

export function NoticeAcknowledgement({
  postId,
  acknowledgedAt,
  compact = false,
}: {
  postId: string;
  acknowledgedAt?: string;
  compact?: boolean;
}) {
  const [acknowledged, setAcknowledged] = useState(Boolean(acknowledgedAt));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (acknowledged) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--notice-success)]">
        <Check className="size-3.5" /> Acknowledged
      </span>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        variant="secondary"
        disabled={pending}
        className="rounded-full"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await acknowledgeNewsPostAction(postId);
            if (result?.error) setError(result.error);
            else setAcknowledged(true);
          });
        }}
      >
        <CircleAlert className="size-4" />
        {pending ? "Saving…" : "Acknowledge"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

