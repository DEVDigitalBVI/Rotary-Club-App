import { getMyProjectSlots } from "@/lib/data/project-slots";
import { createClient } from "@/lib/supabase/server";
import { throwOnSupabaseError } from "@/lib/supabase/errors";
import { todayDateString } from "@/lib/format";
import { rotaryYear, summarizePersonalHours, type PersonalHoursRow } from "@/lib/my-rotary";
import { toNotification, type NotificationRow } from "@/lib/notifications";

/** Explicit member filters supplement RLS, including for officers who can read other members. */
export async function getMyRotaryActivity(memberId: string) {
  const supabase = await createClient();
  const today = todayDateString();
  const year = rotaryYear(today);

  async function serviceHours() {
    const rows: PersonalHoursRow[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabase.from("volunteer_hours")
        .select("hours")
        .eq("member_id", memberId)
        .gte("served_on", year.start).lt("served_on", year.end).lte("served_on", today)
        .order("id").range(offset, offset + 499)
        .returns<PersonalHoursRow[]>();
      throwOnSupabaseError(error, "Unable to load your service hours");
      rows.push(...(data ?? []));
      if ((data?.length ?? 0) < 500) return summarizePersonalHours(rows);
    }
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
