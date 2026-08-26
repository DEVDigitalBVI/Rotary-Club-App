"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Member } from "@/lib/mock-data";
import { updateProfileAction } from "@/app/(app)/directory/actions";
import { MemberAvatar } from "@/components/member-avatar";
import { cn } from "@/lib/utils";
import { validateProfilePhoto } from "@/lib/profile-photo";

export function EditProfileDialog({ member }: { member: Member }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [photoPreview, setPhotoPreview] = useState<string | null>(member.avatarUrl ?? null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  function resetPhotoState() {
    setPhotoPreview(member.avatarUrl ?? null);
    setRemovePhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setError(null);
          resetPhotoState();
        }
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
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <fieldset className="rounded-2xl border border-border bg-muted/30 p-4">
            <legend className="px-1 text-sm font-semibold text-foreground">Profile photo</legend>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
              <MemberAvatar
                member={{ ...member, avatarUrl: photoPreview ?? undefined }}
                className="size-24 ring-4 ring-background shadow-sm"
                fallbackClassName="font-heading text-2xl"
              />
              <div className="flex flex-1 flex-col items-center gap-2 text-center sm:items-start sm:text-left">
                <p className="text-sm leading-5 text-muted-foreground">
                  Choose a clear, square photo. JPEG, PNG, or WebP, up to 3 MB.
                </p>
                <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                  <label htmlFor="edit-profile-photo" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}>
                    <Camera aria-hidden="true" />
                    {photoPreview ? "Choose another" : "Choose photo"}
                  </label>
                  {photoPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        setPhotoPreview(null);
                        setRemovePhoto(true);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <Trash2 />Remove photo
                    </Button>
                  )}
                </div>
                <Input
                  ref={fileInputRef}
                  id="edit-profile-photo"
                  name="profilePhoto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const validationError = validateProfilePhoto(file);
                    if (validationError) {
                      setError(validationError);
                      event.target.value = "";
                      return;
                    }
                    setError(null);
                    setRemovePhoto(false);
                    setPhotoPreview(URL.createObjectURL(file));
                  }}
                />
                <input type="hidden" name="removePhoto" value={String(removePhoto)} />
                {removePhoto && <p role="status" className="text-xs font-medium text-muted-foreground">Your initials will be shown after you save.</p>}
              </div>
            </div>
          </fieldset>
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
            <Label htmlFor="edit-dob">Birthday</Label>
            <Input
              id="edit-dob"
              name="dateOfBirth"
              type="date"
              defaultValue={member.dateOfBirth}
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll give you a shout-out on the home screen that day.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-bio">Bio</Label>
            <Textarea id="edit-bio" name="bio" rows={3} defaultValue={member.bio} />
          </div>
          <DialogFooter className="mt-2">
            <Button type="submit" disabled={pending} className="font-heading">
              {pending ? "Saving profile…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
