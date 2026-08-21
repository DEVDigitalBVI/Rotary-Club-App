"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FoundationRecognition } from "@/lib/mock-data";

export type DirectoryFormState = { error?: string; success?: boolean } | undefined;

/**
 * Adding a member is just a roster row — RLS (members_insert) requires
 * runs_the_club(). They join the app itself at /signup once they have this
 * email on file; there's no invite email to send here.
 */
export async function addMemberAction(
  _prevState: DirectoryFormState,
  formData: FormData
): Promise<DirectoryFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const classification = String(formData.get("classification") ?? "").trim();

  if (!name || !email) {
    return { error: "Name and email are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("members").insert({
    name,
    email,
    classification: classification || null,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "That email is already on the roster."
          : "Couldn't add member — you may not have permission.",
    };
  }

  revalidatePath("/directory");
  return { success: true };
}

/**
 * Self-service profile fields only. Email is excluded — it's how sign-in and
 * claim_member() match a person to their roster row, so changing it here
 * would need to stay in sync with their auth account, which isn't wired up.
 * Avatar upload needs Supabase Storage, not set up yet either.
 */
export async function updateProfileAction(
  memberId: string,
  _prevState: DirectoryFormState,
  formData: FormData
): Promise<DirectoryFormState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({ phone: phone || null, bio: bio || null, date_of_birth: dateOfBirth || null })
    .eq("id", memberId);

  if (error) {
    return { error: "Couldn't save — you may not have permission to edit this profile." };
  }

  revalidatePath(`/directory/${memberId}`);
  return { success: true };
}

/**
 * Diffs against the committee's current roster rather than replacing it
 * wholesale, so RLS (can_manage_committee) evaluates each add/remove as its
 * own insert/delete — matching how ManageCommitteeDialog already scopes the
 * director-only edit right per committee.
 */
export async function updateCommitteeRosterAction(
  committeeId: string,
  currentMemberIds: string[],
  nextMemberIds: string[]
): Promise<DirectoryFormState> {
  const toAdd = nextMemberIds.filter((id) => !currentMemberIds.includes(id));
  const toRemove = currentMemberIds.filter((id) => !nextMemberIds.includes(id));

  const supabase = await createClient();

  if (toAdd.length > 0) {
    const { error } = await supabase
      .from("committee_members")
      .insert(toAdd.map((memberId) => ({ committee_id: committeeId, member_id: memberId })));
    if (error) {
      return { error: "Couldn't save — you may not have permission to manage this committee." };
    }
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("committee_members")
      .delete()
      .eq("committee_id", committeeId)
      .in("member_id", toRemove);
    if (error) {
      return { error: "Couldn't save — you may not have permission to manage this committee." };
    }
  }

  revalidatePath("/directory");
  return { success: true };
}

/**
 * Routed through the update_member_recognition RPC rather than a plain
 * table update — canEditRecognition() (Secretary or the Foundation
 * director) is a narrower group than what the members table's own RLS
 * allows, so the permission check has to live in the RPC.
 */
export async function updateRecognitionAction(
  memberId: string,
  recognition: FoundationRecognition
): Promise<DirectoryFormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_member_recognition", {
    target_member_id: memberId,
    p_paul_harris_count: recognition.paulHarrisCount,
    p_polio_plus_society: recognition.polioPlusSociety,
    p_action_groups: recognition.actionGroups,
  });

  if (error) {
    return { error: "Couldn't save — you may not have permission to edit recognition." };
  }

  revalidatePath(`/directory/${memberId}`);
  return { success: true };
}

/** Reversible roster status change. Hard delete is deliberately not offered
 * here — see the members table's migration comment: no delete RLS policy
 * exists, a club deactivates a member rather than erasing their record. */
export async function updateMemberStatusAction(
  memberId: string,
  status: "active" | "inactive"
): Promise<DirectoryFormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("members").update({ status }).eq("id", memberId);

  if (error) {
    return { error: "Couldn't update status — you may not have permission." };
  }

  revalidatePath(`/directory/${memberId}`);
  revalidatePath("/directory");
  return { success: true };
}

/**
 * Routed through the assign_member_position RPC rather than a plain table
 * update — the permission rule is split (only the President may name a
 * President-Elect or Secretary-Elect; the wider can_assign_roles() group
 * covers President, Secretary, and Treasurer), so it has to live server-side.
 */
export async function assignMemberPositionAction(
  memberId: string,
  position: string | null
): Promise<DirectoryFormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("assign_member_position", {
    target_member_id: memberId,
    new_position: position,
  });

  if (error) {
    return { error: "Couldn't assign that role — you may not have permission." };
  }

  revalidatePath(`/directory/${memberId}`);
  revalidatePath("/directory");
  return { success: true };
}

/**
 * Routed through the assign_committee_director RPC, which also seats the
 * new director on their own committee's roster.
 */
export async function assignCommitteeDirectorAction(
  committeeId: string,
  memberId: string | null
): Promise<DirectoryFormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("assign_committee_director", {
    target_committee_id: committeeId,
    target_member_id: memberId,
  });

  if (error) {
    return { error: "Couldn't assign a director — you may not have permission." };
  }

  revalidatePath("/directory");
  return { success: true };
}

/**
 * The annual handover: promotes President-Elect and Secretary-Elect into
 * the seats they were elected to, and clears whoever was outgoing. See
 * start_new_rotary_year() — a vacant Elect slot just leaves that seat
 * vacant rather than erroring.
 */
export async function startNewRotaryYearAction(): Promise<DirectoryFormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("start_new_rotary_year");

  if (error) {
    return { error: "Couldn't start the new Rotary year — you may not have permission." };
  }

  revalidatePath("/directory");
  return { success: true };
}
