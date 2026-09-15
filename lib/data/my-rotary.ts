import { getMyProjectSlots } from "@/lib/data/project-slots";
import { createClient } from "@/lib/supabase/server";
import { throwOnSupabaseError } from "@/lib/supabase/errors";
import { todayDateString } from "@/lib/format";
import { rotaryYear } from "@/lib/my-rotary";
import { toNotification, type NotificationRow } from "@/lib/notifications";

/** Explicit member filters supplement RLS, including for officers who can read other members. */
export async function getMyRotaryActivity(memberId: string) {
  const supabase = await createClient();
  const today = todayDateString();
  const year = rotaryYear(today);

  async function serviceHours() {
    const { data, error } = await supabase.rpc("personal_service_total", { p_member: memberId, p_start: year.start, p_end: year.end, p_today: today });
    throwOnSupabaseError(error, "Unable to load your service hours");
    return { total: Number(data ?? 0) };
  }

  const [hours, notices, serviceSlots] = await Promise.all([
    serviceHours(),
    supabase.from("notifications")
      .select("id, type, title, body, link, read_at, created_at", { count: "exact" })
      .eq("recipient_id", memberId).eq("type", "announcement").is("read_at", null)
      .order("created_at", { ascending: false }).limit(3).returns<NotificationRow[]>(),
    getMyProjectSlots(memberId),
  ]);
  throwOnSupabaseError(notices.error, "Unable to load your unread notices");
  return { hours, serviceSlots, year: year.label, notices: (notices.data ?? []).map(toNotification), unreadNoticeCount: notices.count ?? 0 };
}
