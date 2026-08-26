"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/data/members";

export type AccountFormState = { error?: string; success?: boolean } | undefined;

/**
 * Members self-log their own makeups (RLS: member_id = current_member_id()).
 * The makeups_notify_secretary trigger handles alerting the Secretary — no
 * notification logic lives here, so it can't be routed around by any other
 * write path into the table.
 */
export async function logMakeupAction(
  memberId: string,
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const attendedOn = String(formData.get("attendedOn") ?? "").trim();
  const clubOrEvent = String(formData.get("clubOrEvent") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!attendedOn || !clubOrEvent) {
    return { error: "Date and club/event are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("makeups").insert({
    member_id: memberId,
    attended_on: attendedOn,
    club_or_event: clubOrEvent,
    notes: notes || null,
  });

  if (error) {
    return { error: "Couldn't log that makeup." };
  }

  revalidatePath("/account");
  return { success: true };
}

/** Secretary confirms they've keyed a makeup into ClubRunner. */
export async function markMakeupClubrunnerLoggedAction(
  makeupId: string
): Promise<AccountFormState> {
  const currentMember = await getCurrentMember();
  const supabase = await createClient();
  const { error } = await supabase
    .from("makeups")
    .update({
      clubrunner_logged: true,
      clubrunner_logged_at: new Date().toISOString(),
      clubrunner_logged_by: currentMember?.id ?? null,
    })
    .eq("id", makeupId);

  if (error) {
    return { error: "Couldn't update that makeup — you may not have permission." };
  }

  revalidatePath("/account");
  return { success: true };
}
