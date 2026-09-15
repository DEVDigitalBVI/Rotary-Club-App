import { createClient } from "@/lib/supabase/server";
import { throwOnSupabaseError } from "@/lib/supabase/errors";
import { defaultNotificationPreferences, type NotificationPreferences } from "@/lib/notifications";

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("announcements, events, service, chat, administration")
    .maybeSingle<NotificationPreferences>();
  throwOnSupabaseError(error, "Unable to load notification preferences");
  return data ?? defaultNotificationPreferences;
}
