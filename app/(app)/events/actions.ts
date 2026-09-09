"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/data/members";
import {
  EVENT_MATERIALS_BUCKET,
  eventMaterialExtension,
  eventMaterialStoragePath,
  validateEventMaterial,
} from "@/lib/event-materials";
import type { RsvpStatus } from "@/lib/club";

export type EventFormState = { error?: string; success?: boolean } | undefined;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function removeStoredMaterial(
  supabase: SupabaseServerClient,
  publicUrl: string | null | undefined
) {
  const path = eventMaterialStoragePath(publicUrl);
  if (path) await supabase.storage.from(EVENT_MATERIALS_BUCKET).remove([path]);
}

async function uploadFlyer(supabase: SupabaseServerClient, eventId: string, file: File) {
  const validationError = validateEventMaterial(file, "flyer");
  if (validationError) return { error: validationError };

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("flyer_url")
    .eq("id", eventId)
    .maybeSingle<{ flyer_url: string | null }>();
  if (eventError || !event) {
    return { error: "Couldn't upload the flyer — event not found or permission denied." };
  }

  const path = `${eventId}/flyer-${Date.now()}${eventMaterialExtension(file.type)}`;
  const { error: uploadError } = await supabase.storage
    .from(EVENT_MATERIALS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (uploadError) return { error: "Couldn't upload the flyer." };

  const {
    data: { publicUrl },
  } = supabase.storage.from(EVENT_MATERIALS_BUCKET).getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("events")
    .update({ flyer_url: publicUrl, flyer_alt: file.name })
    .eq("id", eventId);
  if (updateError) {
    await supabase.storage.from(EVENT_MATERIALS_BUCKET).remove([path]);
    return { error: "Couldn't save the flyer — you may not have permission." };
  }

  await removeStoredMaterial(supabase, event.flyer_url);

  return { success: true as const };
}

async function uploadAgenda(supabase: SupabaseServerClient, eventId: string, file: File) {
  const validationError = validateEventMaterial(file, "agenda");
  if (validationError) return { error: validationError };

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("agenda_url")
    .eq("id", eventId)
    .maybeSingle<{ agenda_url: string | null }>();
  if (eventError || !event) {
    return { error: "Couldn't upload the agenda — event not found or permission denied." };
  }

  const path = `${eventId}/agenda-${Date.now()}${eventMaterialExtension(file.type)}`;
  const { error: uploadError } = await supabase.storage
    .from(EVENT_MATERIALS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (uploadError) return { error: "Couldn't upload the agenda." };

  const {
    data: { publicUrl },
  } = supabase.storage.from(EVENT_MATERIALS_BUCKET).getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("events")
    .update({
      agenda_file_name: file.name,
      agenda_url: publicUrl,
      agenda_uploaded_at: new Date().toISOString(),
      agenda_size_label: `${Math.max(1, Math.round(file.size / 1024))} KB`,
    })
    .eq("id", eventId);
  if (updateError) {
    await supabase.storage.from(EVENT_MATERIALS_BUCKET).remove([path]);
    return { error: "Couldn't save the agenda — you may not have permission." };
  }

  await removeStoredMaterial(supabase, event.agenda_url);

  return { success: true as const };
}

/**
 * Combines a date-picker value ("YYYY-MM-DD") and a time-picker value
 * ("HH:MM") into an absolute instant, treating them as club-local (BVI)
 * wall-clock time. Tortola doesn't observe daylight saving, so it's always
 * UTC-4 — a fixed offset is correct here, not a shortcut.
 */
function toClubInstant(date: string, time: string) {
  return new Date(`${date}T${time}:00-04:00`);
}

export async function createEventAction(
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const countsTowardAttendance = formData.get("countsTowardAttendance") === "on";
  const capacity = Number(formData.get("capacity")) || null;
  const allowGuests = formData.get("allowGuests") === "on";
  const waitlistEnabled = formData.get("waitlistEnabled") === "on";
  const dietaryNotesEnabled = formData.get("dietaryNotesEnabled") === "on";
  const flyer = formData.get("flyer");
  const agenda = formData.get("agenda");

  if (!title || !date || !time) {
    return { error: "Title, date, and time are required." };
  }

  const startsAt = toClubInstant(date, time);
  if (Number.isNaN(startsAt.getTime())) {
    return { error: "Enter a valid date and time." };
  }

  const attachments = [
    { kind: "flyer" as const, file: flyer },
    { kind: "agenda" as const, file: agenda },
  ].filter((item): item is { kind: "flyer" | "agenda"; file: File } =>
    item.file instanceof File && item.file.size > 0
  );
  // Validate every file before uploading anything or creating an event.
  for (const { kind, file } of attachments) {
    const error = validateEventMaterial(file, kind);
    if (error) return { error };
  }

  const supabase = await createClient();
  const eventId = randomUUID();
  const storage = supabase.storage.from(EVENT_MATERIALS_BUCKET);
  const uploadedPaths: string[] = [];
  const materials: {
    flyer_url?: string; flyer_alt?: string;
    agenda_url?: string; agenda_file_name?: string;
    agenda_uploaded_at?: string; agenda_size_label?: string;
  } = {};
  let published = false;
  try {
    // Storage policies authorize officers independently of an event row.
    // Publish once, with all URLs attached, only after every upload succeeds.
    for (const { kind, file } of attachments) {
      const path = `${eventId}/${kind}${eventMaterialExtension(file.type)}`;
      uploadedPaths.push(path);
      const { error } = await storage.upload(path, file, { contentType: file.type });
      if (error) return { error: `Couldn't upload the ${kind}. The event has not been published.` };
      const { data: { publicUrl } } = storage.getPublicUrl(path);
      if (kind === "flyer") {
        materials.flyer_url = publicUrl;
        materials.flyer_alt = file.name;
      } else {
        materials.agenda_url = publicUrl;
        materials.agenda_file_name = file.name;
        materials.agenda_uploaded_at = new Date().toISOString();
        materials.agenda_size_label = `${Math.max(1, Math.round(file.size / 1024))} KB`;
      }
    }

    const { error } = await supabase.from("events").insert({
      id: eventId,
      title,
      starts_at: startsAt.toISOString(),
      location: location || null,
      description: description || null,
      counts_toward_attendance: countsTowardAttendance,
      capacity,
      allow_guests: allowGuests,
      waitlist_enabled: waitlistEnabled,
      dietary_notes_enabled: dietaryNotesEnabled,
      ...materials,
    });
    if (error) return { error: "Couldn't create the event — you may not have permission." };
    published = true;
  } catch {
    return { error: "Couldn't finish publishing the event. Please check Events before trying again." };
  } finally {
    if (!published && uploadedPaths.length > 0) {
      try {
        const { error } = await storage.remove(uploadedPaths);
        if (error) console.error("Unable to clean up unpublished event attachments.");
      } catch {
        console.error("Unable to clean up unpublished event attachments.");
      }
    }
  }

  revalidatePath("/events");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteEventAction(eventId: string): Promise<EventFormState> {
  const member = await getCurrentMember();
  if (!member) return { error: "You must be signed in." };

  const supabase = await createClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("flyer_url, agenda_url")
    .eq("id", eventId)
    .maybeSingle<{ flyer_url: string | null; agenda_url: string | null }>();
  if (eventError || !event) return { error: "Event not found." };

  const { data: deleted, error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .select("id")
    .maybeSingle();
  if (error || !deleted) return { error: "Couldn't delete the event — you may not have permission." };

  await Promise.all([
    removeStoredMaterial(supabase, event.flyer_url),
    removeStoredMaterial(supabase, event.agenda_url),
  ]);
  revalidatePath("/events");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateRsvpAction(
  eventId: string,
  status: Exclude<RsvpStatus, "none">,
  details?: { guestCount?: number; dietaryNotes?: string }
): Promise<EventFormState> {
  const member = await getCurrentMember();
  if (!member) return { error: "You must be signed in." };
  const supabase = await createClient();
  const guestCount = Math.max(0, Math.min(10, Math.floor(details?.guestCount ?? 0)));
  let { error } = await supabase.rpc("change_event_rsvp", {
    p_event: eventId, p_status: status, p_guests: guestCount,
    p_dietary: details?.dietaryNotes?.trim() || null,
  });
  // Preserve the existing RSVP path until this environment applies the migration.
  if (error && ["PGRST202", "42883"].includes(error.code)) {
    const legacy = await supabase.from("event_rsvps").upsert({
      event_id: eventId, member_id: member.id, status,
      guest_count: status === "yes" ? guestCount : 0,
      dietary_notes: details?.dietaryNotes?.trim() || null,
      registration_status: "registered",
    }, { onConflict: "event_id,member_id" });
    error = legacy.error;
  }
  if (error) return { error: error.code === "P0001" ? error.message : "Couldn't update your RSVP." };

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function uploadEventFlyerAction(
  eventId: string,
  formData: FormData
): Promise<EventFormState> {
  const file = formData.get("flyer");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file first." };
  }

  const supabase = await createClient();
  const result = await uploadFlyer(supabase, eventId, file);
  if (!result.error) {
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
  revalidatePath("/dashboard");
  }
  return result;
}

export async function removeEventFlyerAction(eventId: string): Promise<EventFormState> {
  const supabase = await createClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("flyer_url")
    .eq("id", eventId)
    .maybeSingle<{ flyer_url: string | null }>();
  if (eventError || !event) {
    return { error: "Couldn't remove the flyer — event not found or permission denied." };
  }
  const { error } = await supabase
    .from("events")
    .update({ flyer_url: null, flyer_alt: null })
    .eq("id", eventId);

  if (error) return { error: "Couldn't remove the flyer — you may not have permission." };

  await removeStoredMaterial(supabase, event.flyer_url);

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function uploadEventAgendaAction(
  eventId: string,
  formData: FormData
): Promise<EventFormState> {
  const file = formData.get("agenda");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file first." };
  }

  const supabase = await createClient();
  const result = await uploadAgenda(supabase, eventId, file);
  if (!result.error) {
    revalidatePath(`/events/${eventId}`);
  }
  return result;
}

export async function removeEventAgendaAction(eventId: string): Promise<EventFormState> {
  const supabase = await createClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("agenda_url")
    .eq("id", eventId)
    .maybeSingle<{ agenda_url: string | null }>();
  if (eventError || !event) {
    return { error: "Couldn't remove the agenda — event not found or permission denied." };
  }
  const { error } = await supabase
    .from("events")
    .update({
      agenda_file_name: null,
      agenda_url: null,
      agenda_uploaded_at: null,
      agenda_size_label: null,
    })
    .eq("id", eventId);

  if (error) return { error: "Couldn't remove the agenda — you may not have permission." };

  await removeStoredMaterial(supabase, event.agenda_url);

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

/** Replaces the complete attendance roster atomically. Authorization and the
 * existing state are resolved inside set_event_attendance, not trusted from
 * the browser. Saving an empty roster still marks attendance as finalized. */
export async function saveEventAttendanceAction(
  eventId: string,
  nextAttendeeIds: string[]
): Promise<EventFormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_event_attendance", {
    target_event_id: eventId,
    attendee_ids: [...new Set(nextAttendeeIds)],
  });
  if (error) return { error: "Couldn't save attendance — you may not have permission." };

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/account");
  return { success: true };
}
