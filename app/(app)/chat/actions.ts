"use server";

import { escapeChatSearch } from "@/lib/chat-display";
import { toMessage } from "@/lib/chat-message";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/data/members";
import { createClient } from "@/lib/supabase/server";
import { getChatThread, getChatChannels, type ChatMessage, type ChatReaction } from "@/lib/data/chat";

async function requireMember() {
  const member = await getCurrentMember();
  if (!member) throw new Error("You must be signed in.");
  return member;
}

export async function sendChatMessageAction(channelId: string, body: string, replyToId?: string, messageId?: string) {
  const member = await requireMember();
  if (messageId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)) throw new Error("Invalid message ID.");
  const cleanBody = body.trim();
  if (!cleanBody || cleanBody.length > 4000) throw new Error("Messages must be 1–4,000 characters.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ ...(messageId ? { id: messageId } : {}), channel_id: channelId, sender_id: member.id, body: cleanBody, reply_to_id: replyToId ?? null })
    .select("id, channel_id, sender_id, body, reply_to_id, edited_at, deleted_at, created_at")
    .single();
  // A retry after a lost response must not create a second message.
  if (error?.code === "23505" && messageId) {
    const existing = await supabase.from("chat_messages")
      .select("id, channel_id, sender_id, body, reply_to_id, edited_at, deleted_at, created_at")
      .eq("id", messageId).eq("channel_id", channelId).eq("sender_id", member.id).single();
    if (!existing.error && existing.data?.body === cleanBody && existing.data.reply_to_id === (replyToId ?? null)) return existing.data;
  }
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
  const allowed = ["👍", "❤️", "👏", "🎉", "🙏", "😊", "😂", "🙌", "🔥", "💯", "✅", "👀", "🤝", "💡", "📌"];
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

export async function markChatReadAction(channelId: string, through: string) {
  const member = await requireMember();
  const supabase = await createClient();
  if (Number.isNaN(Date.parse(through)) || Date.parse(through) > Date.now() + 60_000) throw new Error("Invalid read time.");
  const { error } = await supabase.from("chat_channel_reads").upsert({
    channel_id: channelId,
    member_id: member.id,
    last_read_at: through,
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

export async function deleteDirectChatAction(channelId: string) {
  await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_owned_direct_chat", {
    target_channel_id: channelId,
  });
  if (error) {
    throw new Error("Only the member who started this direct chat can delete it.", { cause: error });
  }
  revalidatePath("/chat");
}

export async function loadEarlierChatMessagesAction(channelId: string, before: string): Promise<ChatMessage[]> {
  await requireMember();
  if (Number.isNaN(Date.parse(before))) throw new Error("Invalid message cursor.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, channel_id, sender_id, body, reply_to_id, edited_at, deleted_at, created_at")
    .eq("channel_id", channelId)
    .lt("created_at", before)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error("Unable to load earlier messages.", { cause: error });

  const rows = data ?? [];
  const ids = rows.map((row) => row.id);
  const reactionResult = ids.length
    ? await supabase.from("chat_reactions").select("message_id, member_id, emoji").in("message_id", ids)
    : { data: [] as ChatReaction[], error: null };
  if (reactionResult.error) throw new Error("Unable to load message reactions.", { cause: reactionResult.error });
  const reactions = (reactionResult.data ?? []) as { message_id: string; member_id: string; emoji: string }[];

  return rows.reverse().map((row) => toMessage(row, reactions));
}

/** Session client keeps both search and context subject to message RLS. */
export async function searchChatMessagesAction(channelId: string, query: string, offset = 0) {
  await requireMember();
  const needle = query.trim();
  if (!needle || needle.length > 200 || !Number.isSafeInteger(offset) || offset < 0) throw new Error("Invalid search.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("chat_messages")
    .select("id, channel_id, sender_id, body, reply_to_id, edited_at, deleted_at, created_at")
    .eq("channel_id", channelId).is("deleted_at", null)
    .ilike("body", `%${escapeChatSearch(needle)}%`)
    .order("created_at", { ascending: false }).order("id", { ascending: false })
    .range(offset, offset + 49);
  if (error) throw new Error("Unable to search messages.", { cause: error });
  return (data ?? []).map((row) => toMessage(row, []));
}

export async function loadChatContextAction(channelId: string, messageId: string) {
  await requireMember();
  const supabase = await createClient();
  const columns = "id, channel_id, sender_id, body, reply_to_id, edited_at, deleted_at, created_at";
  const { data: target, error } = await supabase.from("chat_messages").select(columns).eq("channel_id", channelId).eq("id", messageId).single();
  if (error || !target) throw new Error("That message is no longer available.");
  const [before, after] = await Promise.all([
    supabase.from("chat_messages").select(columns).eq("channel_id", channelId).lt("created_at", target.created_at).order("created_at", { ascending: false }).limit(20),
    supabase.from("chat_messages").select(columns).eq("channel_id", channelId).gte("created_at", target.created_at).neq("id", messageId).order("created_at").order("id").limit(20),
  ]);
  if (before.error || after.error) throw new Error("Unable to load surrounding messages.");
  return [...(before.data ?? []).reverse(), target, ...(after.data ?? [])].map((row) => toMessage(row, []));
}

export async function refreshChatChannelsAction() {
  const member = await requireMember();
  return getChatChannels(member.id, null);
}

export async function loadChatThreadAction(channelId: string) {
  await requireMember();
  return getChatThread(channelId);
}
