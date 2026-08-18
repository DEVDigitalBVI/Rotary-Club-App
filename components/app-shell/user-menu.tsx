"use client";

import Link from "next/link";
import { ChevronsUpDown, LogOut, User, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Member } from "@/lib/mock-data";

export function UserMenu({
  member,
  variant = "compact",
}: {
  member: Member;
  variant?: "compact" | "expanded";
}) {
  const avatar = (
    <Avatar className="size-8 shrink-0 border border-border">
      <AvatarFallback
        className="font-heading text-xs font-semibold text-white"
        style={{ backgroundColor: member.avatarColor }}
      >
        {member.initials}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          variant === "compact"
            ? "flex items-center gap-2 rounded-full"
            : "flex w-full items-center gap-2.5 rounded-lg p-2 text-left hover:bg-sidebar-accent"
        )}
      >
        {avatar}
        {variant === "expanded" && (
          <>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="font-heading truncate text-sm font-medium text-sidebar-foreground">
                {member.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {member.role === "admin" ? "Board / Admin" : "Member"}
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={variant === "expanded" ? "start" : "end"} className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="font-heading text-sm font-medium">{member.name}</p>
          <p className="text-xs text-muted-foreground">{member.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLinkItem render={<Link href={`/directory/${member.id}`} />}>
          <User />
          My profile
        </DropdownMenuLinkItem>
        <DropdownMenuLinkItem render={<Link href="/account" />}>
          <Settings />
          Account settings
        </DropdownMenuLinkItem>
        <DropdownMenuSeparator />
        <DropdownMenuLinkItem variant="destructive" render={<Link href="/login" />}>
          <LogOut />
          Sign out
        </DropdownMenuLinkItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
