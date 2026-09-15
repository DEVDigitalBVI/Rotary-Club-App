"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadNotificationInbox, markAllNotificationsReadAction, markNotificationReadAction } from "@/app/(app)/notifications/actions";

type Inbox = Awaited<ReturnType<typeof loadNotificationInbox>>;
type InboxContext = Inbox & { pending: boolean; error: string; markRead: (id?: string) => Promise<void>; loadMore: () => Promise<void> };
const Context = createContext<InboxContext | null>(null);

export function NotificationProvider({ initial, children }: { initial: Inbox; children: React.ReactNode }) {
  const [inbox, setInbox] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const limit = useRef(20);
  const generation = useRef(0);
  const busy = useRef(false);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    const next = await loadNotificationInbox(limit.current);
    if (request === generation.current) { setInbox(next); setError(""); }
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
    return () => { disposed = true; generation.current++; clearTimeout(timer); window.removeEventListener("focus", reconcile); window.removeEventListener("online", reconcile); void db.removeChannel(channel); };
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
  async function loadMore() { await perform(async () => { limit.current += 20; await refresh(); }); }
  return <Context.Provider value={{ ...inbox, pending, error, markRead, loadMore }}>{children}</Context.Provider>;
}

export function useNotifications() {
  const value = useContext(Context);
  if (!value) throw new Error("NotificationProvider is missing");
  return value;
}
