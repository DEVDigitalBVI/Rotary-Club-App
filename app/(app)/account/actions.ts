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
