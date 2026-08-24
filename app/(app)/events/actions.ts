"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { RsvpStatus } from "@/lib/mock-data";

export type EventFormState = { error?: string; success?: boolean } | undefined;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const EVENT_MATERIALS_BUCKET = "event-materials";

function extensionFromName(name: string) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

async function uploadFlyer(supabase: SupabaseServerClient, eventId: string, file: File) {
  const path = `${eventId}/flyer-${Date.now()}${extensionFromName(file.name)}`;
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
  if (updateError) return { error: "Couldn't save the flyer — you may not have permission." };

  return { success: true as const };
}

async function uploadAgenda(supabase: SupabaseServerClient, eventId: string, file: File) {
  const path = `${eventId}/agenda-${Date.now()}${extensionFromName(file.name)}`;
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
  if (updateError) return { error: "Couldn't save the agenda — you may not have permission." };

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
  const flyer = formData.get("flyer");
  const agenda = formData.get("agenda");

  if (!title || !date || !time) {
    return { error: "Title, date, and time are required." };
  }

  const startsAt = toClubInstant(date, time);
  if (Number.isNaN(startsAt.getTime())) {
    return { error: "Enter a valid date and time." };
  }

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("events")
    .insert({
      title,
      starts_at: startsAt.toISOString(),
      location: location || null,
      description: description || null,
      counts_toward_attendance: countsTowardAttendance,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: "Couldn't create the event — you may not have permission." };
  }

  if (flyer instanceof File && flyer.size > 0) {
    const result = await uploadFlyer(supabase, inserted.id, flyer);
    if (result.error) return result;
  }
  if (agenda instanceof File && agenda.size > 0) {
    const result = await uploadAgenda(supabase, inserted.id, agenda);
    if (result.error) return result;
  }

  revalidatePath("/events");
  return { success: true };
}

export async function updateRsvpAction(
  eventId: string,
  memberId: string,
  status: Exclude<RsvpStatus, "none">
): Promise<EventFormState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_rsvps")
    .upsert(
      { event_id: eventId, member_id: memberId, status },
      { onConflict: "event_id,member_id" }
    );

  if (error) return { error: "Couldn't update your RSVP." };

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
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
  }
  return result;
}

export async function removeEventFlyerAction(eventId: string): Promise<EventFormState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ flyer_url: null, flyer_alt: null })
    .eq("id", eventId);

  if (error) return { error: "Couldn't remove the flyer — you may not have permission." };

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
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

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

/**
 * Diffs against who's currently marked present rather than replacing the
 * roster wholesale, matching updateCommitteeRosterAction's approach — each
 * add/remove is its own insert/delete, so RLS (can_assign_roles()) applies
 * per row.
 */
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
