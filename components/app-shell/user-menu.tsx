"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, User, Settings } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { positionLabel, type Member } from "@/lib/mock-data";

export function UserMenu({
  member,
  variant = "compact",
}: {
  member: Member;
  variant?: "compact" | "expanded";
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const avatar = (
    <MemberAvatar
      member={member}
      className="size-11 shrink-0"
      fallbackClassName="font-heading text-sm"
    />
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
                {positionLabel(member.position) ?? "Member"}
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={variant === "expanded" ? "start" : "end"} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="font-heading text-sm font-medium">{member.name}</p>
            <p className="text-xs text-muted-foreground">{member.email}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
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
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
