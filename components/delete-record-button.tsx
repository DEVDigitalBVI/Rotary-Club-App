"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteResult = { error?: string; success?: boolean } | undefined;

export function DeleteRecordButton({
  label,
  title,
  description,
  deleteAction,
  returnTo,
  className,
}: {
  label: string;
  title: string;
  description: string;
  deleteAction: () => Promise<DeleteResult>;
  returnTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setError(null); }}>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className={className}>
        <Trash2 />
        {label}
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => startTransition(async () => {
              setError(null);
              const result = await deleteAction();
              if (result?.error) {
                setError(result.error);
                return;
              }
              setOpen(false);
              if (returnTo) router.push(returnTo);
              router.refresh();
            })}
          >
            <Trash2 />
            {pending ? "Deleting…" : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
