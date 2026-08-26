"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NotificationItem } from "@/components/notifications/notification-item";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toNotification, type Notification, type NotificationRow } from "@/lib/data/notifications";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/(app)/notifications/actions";

export function NotificationBell({ notifications: initialNotifications, unreadCount: initialUnreadCount, className }: { notifications: Notification[]; unreadCount: number; className?: string }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [, startTransition] = useTransition();
  useEffect(() => { setNotifications(initialNotifications); setUnreadCount(initialUnreadCount); }, [initialNotifications, initialUnreadCount]);
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("notification-inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => { const item = toNotification(payload.new as NotificationRow); setNotifications((current) => [item, ...current.filter((existing) => existing.id !== item.id)].slice(0, 20)); setUnreadCount((count) => count + 1); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" }, (payload) => { const item = toNotification(payload.new as NotificationRow); setNotifications((current) => current.map((existing) => existing.id === item.id ? item : existing)); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);
  function markRead(id: string) { const wasUnread = notifications.some((item) => item.id === id && !item.read); setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item)); if (wasUnread) setUnreadCount((count) => Math.max(0, count - 1)); startTransition(() => { void markNotificationReadAction(id); }); }
  return <DropdownMenu><DropdownMenuTrigger aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"} className={cn("relative flex size-11 items-center justify-center rounded-full outline-none hover:bg-white/15 focus-visible:ring-3 focus-visible:ring-ring/50", className)}><Bell className="size-5" />{unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-[var(--nav-surface)] bg-destructive px-1 text-[0.62rem] font-bold leading-none text-white">{Math.min(unreadCount, 99)}</span>}</DropdownMenuTrigger><DropdownMenuContent align="end" className="w-[min(24rem,calc(100vw-1rem))] p-2"><div className="flex min-h-11 items-center justify-between gap-3 px-2"><div><p className="font-heading text-base font-semibold">Notifications</p><p className="text-xs text-muted-foreground">{unreadCount ? `${unreadCount} unread` : "You’re all caught up"}</p></div>{unreadCount > 0 && <button type="button" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { setNotifications((items) => items.map((item) => ({ ...item, read: true }))); setUnreadCount(0); startTransition(() => { void markAllNotificationsReadAction(); }); }}><CheckCheck className="size-4" />Mark all read</button>}</div><DropdownMenuSeparator /><div className="max-h-[min(28rem,60dvh)] overflow-y-auto py-1">{notifications.length ? notifications.slice(0, 8).map((item) => <NotificationItem key={item.id} notification={item} compact onOpen={() => markRead(item.id)} />) : <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>}</div><DropdownMenuSeparator /><Link href="/notifications" className="flex min-h-11 items-center justify-center rounded-lg text-sm font-semibold text-primary outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">View all notifications</Link></DropdownMenuContent></DropdownMenu>;
}
