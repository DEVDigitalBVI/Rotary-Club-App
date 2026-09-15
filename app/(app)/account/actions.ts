"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/data/members";

export type AccountFormState = { error?: string; success?: boolean } | undefined;

/** Secretary confirms they've keyed a makeup into ClubRunner. */
export async function markMakeupClubrunnerLoggedAction(
  makeupId: string
): Promise<AccountFormState> {
  const currentMember = await getCurrentMember();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("makeups")
    .update({
      clubrunner_logged: true,
      clubrunner_logged_at: new Date().toISOString(),
      clubrunner_logged_by: currentMember?.id ?? null,
    })
    .eq("id", makeupId).select("id").maybeSingle();

  if (error || !data) {
    return { error: "Couldn't update that makeup — you may not have permission." };
  }

  revalidatePath("/account");
  revalidatePath("/projects/makeups");
  return { success: true };
}

export async function markMakeupBatchLogged(entries: { id: string; voided: boolean }[]) {
  if (!entries.length || entries.length > 200) return { error: "Select between 1 and 200 makeups." };
  const db = await createClient();
  const { error } = await db.rpc("complete_makeup_batch", { p_entries: entries });
  if (error) return { error: "Unable to confirm the batch. Refresh the list and review it before trying again." };
  revalidatePath("/projects/makeups");
  return { success: true };
}
