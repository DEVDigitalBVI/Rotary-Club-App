"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/data/members";

export type NewsFormState = { error?: string; success?: boolean } | undefined;

export async function postNewsAction(
  _prevState: NewsFormState,
  formData: FormData
): Promise<NewsFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audience = String(formData.get("audience") ?? "all");
  const priority = String(formData.get("priority") ?? "normal");
  const isPinned = formData.get("isPinned") === "on";
  const requiresAcknowledgement = formData.get("requiresAcknowledgement") === "on";
  const expiresAt = String(formData.get("expiresAt") ?? "").trim() || null;
  const [audienceType, audienceId = null] = audience.split(":", 2);
  if (!title || !body) {
    return { error: "Title and message are required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: member } = await supabase
    .from("members")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) {
    return { error: "Your account isn't linked to a member profile yet." };
  }

  const { error } = await supabase.from("news_posts").insert({
    source: "club",
    title,
    body,
    author: member.name,
    author_member_id: member.id,
    published_at: new Date().toISOString().slice(0, 10),
    audience_type: audienceType,
    audience_id: audienceType === "all" || audienceType === "board" ? null : audienceId,
    priority,
    is_pinned: isPinned,
    requires_acknowledgement: requiresAcknowledgement,
    expires_at: expiresAt,
  });

  if (error) {
    return { error: "Couldn't post — you may not have permission to post club news." };
  }

  revalidatePath("/news");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateNewsPostAction(
  postId: string,
  _prevState: NewsFormState,
  formData: FormData
): Promise<NewsFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const priority = String(formData.get("priority") ?? "normal");
  const isPinned = formData.get("isPinned") === "on";
  const requiresAcknowledgement = formData.get("requiresAcknowledgement") === "on";
  const expiresAt = String(formData.get("expiresAt") ?? "").trim() || null;
  if (!title || !body) {
    return { error: "Title and message are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("news_posts")
    .update({ title, body, priority, is_pinned: isPinned, requires_acknowledgement: requiresAcknowledgement, expires_at: expiresAt })
    .eq("id", postId);

  if (error) {
    return { error: "Couldn't save — you may not have permission to edit this post." };
  }

  revalidatePath("/news");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function acknowledgeNewsPostAction(postId: string): Promise<NewsFormState> {
  const member = await getCurrentMember();
  if (!member) return { error: "You must be signed in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("news_acknowledgements")
    .upsert({ post_id: postId, member_id: member.id }, { onConflict: "post_id,member_id" });

  if (error) return { error: "Couldn't acknowledge this notice." };
  revalidatePath("/news");
  revalidatePath("/dashboard");
  return { success: true };
}
