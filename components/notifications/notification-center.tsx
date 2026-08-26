"use client";

import { useMemo, useState, useTransition } from "react";
import { BellOff, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationItem } from "@/components/notifications/notification-item";
import type { Notification } from "@/lib/data/notifications";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/(app)/notifications/actions";

export function NotificationCenter({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [pending, startTransition] = useTransition();
  const unread = notifications.filter((item) => !item.read).length;
  const visible = useMemo(() => filter === "unread" ? notifications.filter((item) => !item.read) : notifications, [filter, notifications]);
  function markRead(id: string) { setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item)); startTransition(() => { void markNotificationReadAction(id); }); }
  return <div><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><Tabs value={filter} onValueChange={(value) => setFilter(value as "all" | "unread")}><TabsList><TabsTrigger value="all">All ({notifications.length})</TabsTrigger><TabsTrigger value="unread">Unread ({unread})</TabsTrigger></TabsList></Tabs>{unread > 0 && <Button type="button" variant="outline" disabled={pending} onClick={() => { setNotifications((items) => items.map((item) => ({ ...item, read: true }))); startTransition(() => { void markAllNotificationsReadAction(); }); }}>{pending ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <CheckCheck />}Mark all read</Button>}</div><div className="mt-5 divide-y divide-border overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[var(--shadow-card)]">{visible.map((notification) => <NotificationItem key={notification.id} notification={notification} onOpen={() => markRead(notification.id)} />)}{visible.length === 0 && <EmptyState icon={BellOff} title={filter === "unread" ? "You’re all caught up" : "No notifications yet"} description={filter === "unread" ? "New activity that needs your attention will appear here." : "Announcements, event updates, service activity, and direct chat notifications will collect here."} className="rounded-none border-0 bg-transparent" />}</div></div>;
}
