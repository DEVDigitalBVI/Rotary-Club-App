"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { logMakeupAction } from "@/app/(app)/account/actions";

export function LogMakeupDialog({ memberId }: { memberId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setError(null);
      }}
    >
      <Button size="sm" variant="outline" className="font-heading" onClick={() => setOpen(true)}>
        <Plus />
        Log a makeup
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a makeup</DialogTitle>
          <DialogDescription>
            Attended a meeting at another club, or another qualifying Rotary
            event? Log it here — the Secretary will key it into ClubRunner.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const formData = new FormData(e.currentTarget);
            startTransition(async () => {
              const result = await logMakeupAction(memberId, undefined, formData);
              if (result?.error) {
                setError(result.error);
              } else {
                setOpen(false);
              }
            });
          }}
        >
          {error && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="makeup-date">Date</Label>
            <Input id="makeup-date" name="attendedOn" type="date" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="makeup-club">Club or event</Label>
            <Input
              id="makeup-club"
              name="clubOrEvent"
              placeholder="Rotary Club of St. Thomas"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="makeup-notes">Notes (optional)</Label>
            <Textarea id="makeup-notes" name="notes" rows={2} />
          </div>
          <DialogFooter className="mt-2">
            <Button type="submit" disabled={pending} className="font-heading">
              {pending ? "Logging…" : "Log makeup"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
