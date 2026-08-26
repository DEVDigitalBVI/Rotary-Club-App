"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/data/notifications";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/(app)/account/actions";

export function NotificationBell({
  notifications,
  unreadCount,
  className,
}: {
  notifications: Notification[];
  unreadCount: number;
  className?: string;
}) {
  const [, startTransition] = useTransition();

  function markRead(id: string) {
    startTransition(() => markNotificationReadAction(id));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className={cn(
          "relative flex size-11 items-center justify-center rounded-full outline-none hover:bg-white/15 focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 size-2.5 rounded-full border-2 border-[var(--nav-surface)] bg-destructive" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between gap-2 px-1.5 py-1">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => startTransition(() => markAllNotificationsReadAction())}
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-1.5 py-4 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          notifications.map((n) => {
            const content = (
              <div className="flex w-full flex-col gap-0.5 py-0.5">
                <span className="flex items-center gap-1.5">
                  {!n.read && (
                    <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                  <span className="font-heading text-sm font-medium text-foreground">
                    {n.title}
                  </span>
                </span>
                {n.body && (
                  <span className="text-xs text-muted-foreground">{n.body}</span>
                )}
              </div>
            );

            return n.link ? (
              <DropdownMenuLinkItem
                key={n.id}
                render={<Link href={n.link} onClick={() => markRead(n.id)} />}
              >
                {content}
              </DropdownMenuLinkItem>
            ) : (
              <DropdownMenuItem key={n.id} onClick={() => markRead(n.id)}>
                {content}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
