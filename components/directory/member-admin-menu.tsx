"use client";

import { useTransition } from "react";
import { MoreHorizontal, ShieldOff, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Member } from "@/lib/mock-data";
import { updateMemberStatusAction } from "@/app/(app)/directory/actions";

export function MemberAdminMenu({ member }: { member: Member }) {
  const [pending, startTransition] = useTransition();

  function toggleStatus() {
    startTransition(() => {
      updateMemberStatusAction(member.id, member.status === "active" ? "inactive" : "active");
    });
  }

  return (
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
        <DropdownMenuItem variant="destructive" disabled>
          <Trash2 />
          Remove member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
