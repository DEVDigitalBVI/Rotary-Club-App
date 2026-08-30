"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FoundationRecognition } from "@/lib/mock-data";
import { getCurrentMember } from "@/lib/data/members";
import {
  PROFILE_PHOTOS_BUCKET,
  profilePhotoExtension,
  profilePhotoStoragePath,
  validateProfilePhoto,
} from "@/lib/profile-photo";

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
 */
export async function updateProfileAction(
  memberId: string,
  _prevState: DirectoryFormState,
  formData: FormData
): Promise<DirectoryFormState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();
  const classificationValue = formData.get("classification");
  const classification = typeof classificationValue === "string"
    ? classificationValue.trim()
    : undefined;
  const photo = formData.get("profilePhoto");
  const removePhoto = formData.get("removePhoto") === "true";

  if (classification !== undefined && (!classification || classification.length > 100)) {
    return { error: "Enter a classification between 1 and 100 characters." };
  }

  const supabase = await createClient();
  const { data: existing, error: memberError } = await supabase
    .from("members")
    .select("avatar_url, classification")
    .eq("id", memberId)
    .maybeSingle<{ avatar_url: string | null; classification: string | null }>();
  if (memberError || !existing) {
    return { error: "Couldn't find this profile or you may not have permission to edit it." };
  }
  if (classification !== undefined && existing.classification?.trim()) {
    return { error: "Contact your secretary to change an existing classification." };
  }

  let avatarUrl: string | null | undefined;
  let uploadedPath: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    const validationError = validateProfilePhoto(photo);
    if (validationError) return { error: validationError };

    uploadedPath = `${memberId}/avatar-${Date.now()}${profilePhotoExtension(photo.type)}`;
    const { error: uploadError } = await supabase.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .upload(uploadedPath, photo, { contentType: photo.type, upsert: false });
    if (uploadError) return { error: "Couldn't upload the profile photo. Try another image." };

    avatarUrl = supabase.storage.from(PROFILE_PHOTOS_BUCKET).getPublicUrl(uploadedPath).data.publicUrl;
  } else if (removePhoto) {
    avatarUrl = null;
  }

  const updates: Record<string, string | null> = {
    phone: phone || null,
    bio: bio || null,
    date_of_birth: dateOfBirth || null,
  };
  if (classification !== undefined) {
    updates.classification = classification;
  }
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

  const { error } = await supabase
    .from("members")
    .update(updates)
    .eq("id", memberId);

  if (error) {
    if (uploadedPath) await supabase.storage.from(PROFILE_PHOTOS_BUCKET).remove([uploadedPath]);
    return { error: "Couldn't save — you may not have permission to edit this profile." };
  }

  if (avatarUrl !== undefined) {
    const oldPath = profilePhotoStoragePath(existing.avatar_url);
    if (oldPath) await supabase.storage.from(PROFILE_PHOTOS_BUCKET).remove([oldPath]);
  }

  revalidatePath(`/directory/${memberId}`);
  revalidatePath("/directory");
  revalidatePath("/dashboard");
  revalidatePath("/account");
  return { success: true };
}

/** Replaces the complete committee roster atomically. The RPC checks the
 * caller's committee-specific authority and preserves the assigned director. */
export async function updateCommitteeRosterAction(
  committeeId: string,
  nextMemberIds: string[]
): Promise<DirectoryFormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_committee_roster", {
    target_committee_id: committeeId,
    member_ids: [...new Set(nextMemberIds)],
  });
  if (error) {
    return { error: "Couldn't save — you may not have permission to manage this committee." };
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

export async function deleteMemberAction(memberId: string): Promise<DirectoryFormState> {
  const currentMember = await getCurrentMember();
  if (!currentMember) return { error: "You must be signed in." };
  if (currentMember.id === memberId) return { error: "You cannot remove your own member profile." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .delete()
    .eq("id", memberId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { error: "Couldn't remove this member. Deactivate them instead if their profile has protected club history." };
  }
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
