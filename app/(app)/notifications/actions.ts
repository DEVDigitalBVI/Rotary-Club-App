"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/data/members";
import type { NotificationPreferences } from "@/lib/data/notifications";

function revalidateNotifications() {
  revalidatePath("/", "layout");
  revalidatePath("/notifications");
}

export async function markNotificationReadAction(notificationId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId).is("read_at", null);
  if (error) return { error: "Unable to mark that notification as read." };
  revalidateNotifications();
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications")
    .update({ read_at: new Date().toISOString() }).is("read_at", null);
  if (error) return { error: "Unable to mark notifications as read." };
  revalidateNotifications();
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
