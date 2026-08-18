"use client";

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

export function MemberAdminMenu({ member }: { member: Member }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
        <MoreHorizontal />
        <span className="sr-only">Manage membership</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {member.status === "active" ? (
          <DropdownMenuItem>
            <ShieldOff />
            Mark inactive
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem>
            <ShieldCheck />
            Mark active
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 />
          Remove member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
