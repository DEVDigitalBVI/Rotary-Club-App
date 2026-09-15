"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/data/members";
import { toNotification, type NotificationPreferences } from "@/lib/notifications";

export async function markNotificationReadAction(notificationId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId).is("read_at", null);
  if (error) return { error: "Unable to mark that notification as read." };
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications")
    .update({ read_at: new Date().toISOString() }).is("read_at", null);
  if (error) return { error: "Unable to mark notifications as read." };
  return { success: true };
}

export async function updateNotificationPreferencesAction(preferences: NotificationPreferences) {
  const member = await getCurrentMember();
  if (!member) return { error: "You must be signed in." };
  const supabase = await createClient();
  const { error } = await supabase.from("notification_preferences").upsert({
    member_id: member.id,
    ...preferences,
    updated_at: new Date().toISOString(),
  }, { onConflict: "member_id" });
  if (error) return { error: "Unable to save notification preferences." };
  revalidatePath("/notifications");
  return { success: true };
}

export async function loadNotificationInbox(limit = 20) {
  const db = await createClient();
  const size = Math.min(1000, Math.max(20, Math.trunc(limit) || 20));
  const [rows, unread, chat] = await Promise.all([
    db.from("notifications").select("*").order("created_at", { ascending: false }).order("id").limit(size + 1),
    db.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
    db.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null).eq("type", "chat"),
  ]);
  for (const result of [rows, unread, chat]) if (result.error) throw new Error("Unable to refresh notifications.");
  return { notifications: (rows.data ?? []).slice(0, size).map(toNotification), unreadCount: unread.count ?? 0, unreadChatCount: chat.count ?? 0, hasMore: (rows.data?.length ?? 0) > size };
}
