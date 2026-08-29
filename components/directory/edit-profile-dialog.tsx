"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
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
import { prepareProfilePhoto } from "@/lib/profile-photo-client";

export function EditProfileDialog({
  member,
  initialOpen = false,
}: {
  member: Member;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [photoPreview, setPhotoPreview] = useState<string | null>(member.avatarUrl ?? null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [preparedPhoto, setPreparedPhoto] = useState<File | null>(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  function resetPhotoState() {
    setPhotoPreview(member.avatarUrl ?? null);
    setRemovePhoto(false);
    setPreparedPhoto(null);
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
            if (preparedPhoto) formData.set("profilePhoto", preparedPhoto);
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
                  Choose a photo from your library. The app will resize it automatically before uploading.
                </p>
                <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                  <label aria-disabled={processingPhoto || pending} htmlFor="edit-profile-photo" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer", (processingPhoto || pending) && "pointer-events-none opacity-50")}>
                    {processingPhoto ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <Camera aria-hidden="true" />}
                    {processingPhoto ? "Preparing…" : photoPreview ? "Choose another" : "Choose photo"}
                  </label>
                  {photoPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        setPhotoPreview(null);
                        setRemovePhoto(true);
                        setPreparedPhoto(null);
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
                  accept="image/*"
                  className="sr-only"
                  disabled={processingPhoto || pending}
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setProcessingPhoto(true);
                    setError(null);
                    try {
                      const prepared = await prepareProfilePhoto(file);
                      setPreparedPhoto(prepared);
                      setRemovePhoto(false);
                      setPhotoPreview(URL.createObjectURL(prepared));
                    } catch (cause) {
                      setError(cause instanceof Error ? cause.message : "This photo couldn’t be prepared.");
                      event.target.value = "";
                    } finally {
                      setProcessingPhoto(false);
                    }
                  }}
                />
                <input type="hidden" name="removePhoto" value={String(removePhoto)} />
                {removePhoto && <p role="status" className="text-xs font-medium text-muted-foreground">Your initials will be shown after you save.</p>}
                {preparedPhoto && !processingPhoto && <p role="status" className="text-xs font-medium text-[var(--notice-success)]">Photo ready · {Math.max(1, Math.round(preparedPhoto.size / 1024))} KB</p>}
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
            <Button type="submit" disabled={pending || processingPhoto} className="font-heading">
              {pending ? "Saving profile…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
