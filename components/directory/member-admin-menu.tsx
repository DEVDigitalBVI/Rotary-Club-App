"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, MoreHorizontal, ShieldOff, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Member } from "@/lib/mock-data";
import { deleteMemberAction, updateMemberStatusAction } from "@/app/(app)/directory/actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function MemberAdminMenu({ member }: { member: Member }) {
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function toggleStatus() {
    startTransition(() => {
      updateMemberStatusAction(member.id, member.status === "active" ? "inactive" : "active");
    });
  }

  return <>
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" disabled={pending} />}>
        <MoreHorizontal />
        <span className="sr-only">Manage membership</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {member.status === "active" ? (
          <DropdownMenuItem onClick={toggleStatus}>
            <ShieldOff />
            Mark inactive
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={toggleStatus}>
            <ShieldCheck />
            Mark active
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => setConfirmingDelete(true)}>
          <Trash2 />
          Remove member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive"><AlertTriangle className="size-5" /></div>
          <DialogTitle>Remove {member.name}?</DialogTitle>
          <DialogDescription>This permanently removes their profile, committee memberships, RSVPs, and other linked records. Deactivation is safer when club history should be retained.</DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="ghost" disabled={pending} onClick={() => setConfirmingDelete(false)}>Cancel</Button>
          <Button type="button" variant="destructive" disabled={pending} onClick={() => startTransition(async () => {
            setError(null);
            const result = await deleteMemberAction(member.id);
            if (result?.error) return setError(result.error);
            setConfirmingDelete(false);
            router.push("/directory");
            router.refresh();
          })}><Trash2 />{pending ? "Removing…" : "Remove permanently"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
