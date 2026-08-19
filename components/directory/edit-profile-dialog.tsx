"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
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
import { MemberAvatar } from "@/components/member-avatar";
import type { Member } from "@/lib/mock-data";

export function EditProfileDialog({ member }: { member: Member }) {
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(member.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!avatarUrl || !avatarUrl.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(avatarUrl);
  }, [avatarUrl]);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUrl(URL.createObjectURL(file));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            setOpen(false);
          }}
        >
          <div className="flex items-center gap-3">
            <MemberAvatar
              member={{ ...member, avatarUrl }}
              className="size-16"
              fallbackClassName="font-heading text-xl"
            />
            <div className="flex flex-col gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="font-heading"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera />
                Change photo
              </Button>
              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setAvatarUrl(undefined)}
                >
                  Remove photo
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" defaultValue={member.email} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input id="edit-phone" type="tel" defaultValue={member.phone} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-bio">Bio</Label>
            <Textarea id="edit-bio" rows={3} defaultValue={member.bio} />
          </div>
          <DialogFooter className="mt-2">
            <Button type="submit" className="font-heading">
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
