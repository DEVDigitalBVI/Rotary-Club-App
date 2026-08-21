"use client";

import { useState, useTransition } from "react";
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
import type { Member } from "@/lib/mock-data";
import { updateProfileAction } from "@/app/(app)/directory/actions";

export function EditProfileDialog({ member }: { member: Member }) {
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
      <Button variant="outline" className="font-heading" onClick={() => setOpen(true)}>
        Edit profile
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update the info other members see in the directory.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            startTransition(async () => {
              const result = await updateProfileAction(member.id, undefined, formData);
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
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" defaultValue={member.email} disabled />
            <p className="text-xs text-muted-foreground">
              Contact your secretary to change the email on file.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input id="edit-phone" name="phone" type="tel" defaultValue={member.phone} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-bio">Bio</Label>
            <Textarea id="edit-bio" name="bio" rows={3} defaultValue={member.bio} />
          </div>
          <DialogFooter className="mt-2">
            <Button type="submit" disabled={pending} className="font-heading">
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
