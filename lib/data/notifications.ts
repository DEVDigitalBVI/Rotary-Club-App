import { createClient } from "@/lib/supabase/server";
import { throwOnSupabaseError } from "@/lib/supabase/errors";
import { defaultNotificationPreferences, toNotification, type Notification, type NotificationPreferences, type NotificationRow } from "@/lib/notifications";
export type { Notification, NotificationPreferences } from "@/lib/notifications";

/** RLS (notifications_select) already scopes this to the signed-in member's own inbox. */
export async function getNotifications(limit = 20): Promise<Notification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<NotificationRow[]>();
  throwOnSupabaseError(error, "Unable to load notifications");

  return (data ?? []).map(toNotification);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  throwOnSupabaseError(error, "Unable to load the unread notification count");

  return count ?? 0;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("announcements, events, service, chat, administration")
    .maybeSingle<NotificationPreferences>();
  throwOnSupabaseError(error, "Unable to load notification preferences");
  return data ?? defaultNotificationPreferences;
}
