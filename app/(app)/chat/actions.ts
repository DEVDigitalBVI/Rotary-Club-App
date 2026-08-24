"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/data/members";
import { createClient } from "@/lib/supabase/server";

async function requireMember() {
  const member = await getCurrentMember();
  if (!member) throw new Error("You must be signed in.");
  return member;
}

export async function sendChatMessageAction(channelId: string, body: string, replyToId?: string) {
  const member = await requireMember();
  const cleanBody = body.trim();
  if (!cleanBody || cleanBody.length > 4000) throw new Error("Messages must be 1–4,000 characters.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ channel_id: channelId, sender_id: member.id, body: cleanBody, reply_to_id: replyToId ?? null })
    .select("id, channel_id, sender_id, body, reply_to_id, edited_at, deleted_at, created_at")
    .single();
  if (error) throw new Error("Unable to send that message.", { cause: error });
  return data;
}

export async function deleteChatMessageAction(messageId: string) {
  await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .update({ deleted_at: new Date().toISOString(), body: "Message removed" })
    .eq("id", messageId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error || !data) throw new Error("You do not have permission to remove that message.", { cause: error });
}

export async function toggleChatReactionAction(messageId: string, emoji: string) {
  const member = await requireMember();
  const allowed = ["👍", "❤️", "👏", "🎉", "🙏"];
  if (!allowed.includes(emoji)) throw new Error("Unsupported reaction.");
  const supabase = await createClient();
  const { data: existing, error: lookupError } = await supabase
    .from("chat_reactions")
    .select("message_id")
    .eq("message_id", messageId)
    .eq("member_id", member.id)
    .eq("emoji", emoji)
    .maybeSingle();
  if (lookupError) throw new Error("Unable to update that reaction.", { cause: lookupError });
  const result = existing
    ? await supabase.from("chat_reactions").delete().eq("message_id", messageId).eq("member_id", member.id).eq("emoji", emoji)
    : await supabase.from("chat_reactions").insert({ message_id: messageId, member_id: member.id, emoji });
  if (result.error) throw new Error("Unable to update that reaction.", { cause: result.error });
}

export async function markChatReadAction(channelId: string) {
  const member = await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.from("chat_channel_reads").upsert({
    channel_id: channelId,
    member_id: member.id,
    last_read_at: new Date().toISOString(),
  });
  if (error) throw new Error("Unable to update read status.", { cause: error });
}

export async function startDirectChatAction(otherMemberId: string) {
  await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_or_create_direct_chat", { other_member_id: otherMemberId });
  if (error || !data) throw new Error("Unable to start that conversation.", { cause: error });
  revalidatePath("/chat");
  return data as string;
}
