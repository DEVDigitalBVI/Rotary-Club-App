"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "./notification-item";
import { useNotifications } from "./notification-provider";
export function NotificationCenter() {
  const { notifications, unreadCount, hasMore, pending, error, markRead, loadMore } = useNotifications();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const visible = unreadOnly ? notifications.filter(item => !item.read) : notifications;
  return <section><div className="flex flex-wrap items-center justify-between gap-3"><label className="text-sm"><input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)} /> Unread only ({unreadCount})</label><Button disabled={pending || !unreadCount} variant="outline" onClick={() => void markRead()}>Mark all read</Button></div>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    <div className="mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">{visible.map(item => <NotificationItem key={item.id} notification={item} onOpen={() => void markRead(item.id)} />)}{!visible.length && <p className="p-6 text-sm text-muted-foreground">{hasMore ? "No matching notifications in the loaded history. Load more to continue." : "No notifications to show."}</p>}</div>
    {hasMore && <Button className="mt-4" variant="outline" disabled={pending} onClick={() => void loadMore()}>{pending ? "Loading…" : "Load older notifications"}</Button>}
  </section>;
}
