"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadNotificationInbox, loadOlderNotifications, refreshNotificationRows, markAllNotificationsReadAction, markNotificationReadAction } from "@/app/(app)/notifications/actions";

import { mergeNotifications } from "@/lib/notification-state";

type Inbox = Awaited<ReturnType<typeof loadNotificationInbox>>;
type InboxContext = Inbox & { pending: boolean; error: string; markRead: (id?: string) => Promise<void>; loadMore: () => Promise<void> };
const Context = createContext<InboxContext | null>(null);

export function NotificationProvider({ initial, children }: { initial: Inbox; children: React.ReactNode }) {
  const [inbox, setInbox] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const inboxRef = useRef(inbox);
  useEffect(() => { inboxRef.current = inbox; }, [inbox]);
  const generation = useRef(0);
  const busy = useRef(false);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    const current = inboxRef.current;
    const ids = current.notifications.map(row => row.id);
    const next = await loadNotificationInbox();
    const history = [];
    for (let offset=0; offset<ids.length; offset+=200) history.push(...await refreshNotificationRows(ids.slice(offset,offset+200)));
    if (request === generation.current) { const updated = { ...next, notifications: mergeNotifications(history, next.notifications), hasMore: ids.length ? current.hasMore : next.hasMore }; inboxRef.current = updated; setInbox(updated); setError(""); }
  }, []);
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let subscribed = false;
    const reconcile = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { if (!disposed) void refresh().catch(() => setError("Unable to refresh notifications. Reconnect or try again.")); }, 150);
    };
    const db = createClient();
    const channel = db.channel(`inbox:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, reconcile)
      .subscribe(status => { if (status === "SUBSCRIBED") { if (subscribed) reconcile(); subscribed = true; } });
    window.addEventListener("focus", reconcile);
    window.addEventListener("online", reconcile);
    return () => { disposed = true; clearTimeout(timer); window.removeEventListener("focus", reconcile); window.removeEventListener("online", reconcile); void db.removeChannel(channel); };
  }, [refresh]);
  async function perform(operation: () => Promise<void>) {
    if (busy.current) return;
    busy.current = true; setPending(true); setError("");
    try { await operation(); } catch { setError("Couldn’t save or refresh notifications. Your unread state will be checked when you reconnect. Please try again."); }
    finally { busy.current = false; setPending(false); }
  }
  async function markRead(id?: string) {
    await perform(async () => {
      const result = id ? await markNotificationReadAction(id) : await markAllNotificationsReadAction();
      if (result.error) throw new Error(result.error);
      await refresh();
    });
  }
  async function loadMore() { await perform(async () => {
    const last = inboxRef.current.notifications.at(-1); if (!last) return;
    const page = await loadOlderNotifications({ createdAt: last.createdAt, id: last.id });
    generation.current++;
    const updated = { ...inboxRef.current, notifications: mergeNotifications(inboxRef.current.notifications, page.notifications), hasMore: page.hasMore };
    inboxRef.current = updated; setInbox(updated);
    await refresh();
  }); }
  return <Context.Provider value={{ ...inbox, pending, error, markRead, loadMore }}>{children}</Context.Provider>;
}

export function useNotifications() {
  const value = useContext(Context);
  if (!value) throw new Error("NotificationProvider is missing");
  return value;
}
