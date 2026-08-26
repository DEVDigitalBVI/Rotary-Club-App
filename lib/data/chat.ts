import { createClient } from "@/lib/supabase/server";
import { throwOnSupabaseError } from "@/lib/supabase/errors";

export type ChatChannelKind = "club" | "committee" | "event" | "project" | "dm";

export type ChatReaction = {
  messageId: string;
  memberId: string;
  emoji: string;
};

export type ChatMessage = {
  id: string;
  channelId: string;
  senderId: string;
  body: string;
  replyToId?: string;
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
  reactions: ChatReaction[];
};

export type ChatChannel = {
  id: string;
  name: string;
  kind: ChatChannelKind;
  createdBy?: string;
  contextId?: string;
  memberIds: string[];
  lastReadAt?: string;
  messages: ChatMessage[];
  archivedAt?: string;
  rotaryYear?: string;
  hasEarlierMessages: boolean;
};

type ChannelRow = {
  id: string;
  name: string;
  kind: ChatChannelKind;
  created_by: string | null;
  context_id: string | null;
  archived_at: string | null;
  rotary_year: string | null;
};
type MessageRow = {
  id: string;
  channel_id: string;
  sender_id: string;
  body: string;
  reply_to_id: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  total_count: number;
};
type ReactionRow = { message_id: string; member_id: string; emoji: string };

function toMessage(row: MessageRow, reactions: ReactionRow[]): ChatMessage {
  return {
    id: row.id,
    channelId: row.channel_id,
    senderId: row.sender_id,
    body: row.body,
    replyToId: row.reply_to_id ?? undefined,
    editedAt: row.edited_at ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    reactions: reactions
      .filter((reaction) => reaction.message_id === row.id)
      .map((reaction) => ({
        messageId: reaction.message_id,
        memberId: reaction.member_id,
        emoji: reaction.emoji,
      })),
  };
}

export async function getChatChannels(memberId: string): Promise<ChatChannel[]> {
  const supabase = await createClient();
  const [channelsResult, messagesResult, membersResult, readsResult] =
    await Promise.all([
      supabase.from("chat_channels").select("id, name, kind, context_id, created_by, archived_at, rotary_year"),
      supabase.rpc("get_recent_chat_messages", { per_channel_limit: 50 }),
      supabase.from("chat_channel_members").select("channel_id, member_id"),
      supabase.from("chat_channel_reads").select("channel_id, last_read_at").eq("member_id", memberId),
    ]);

  throwOnSupabaseError(channelsResult.error, "Unable to load chat channels");
  throwOnSupabaseError(messagesResult.error, "Unable to load chat messages");
  throwOnSupabaseError(membersResult.error, "Unable to load direct-message members");
  throwOnSupabaseError(readsResult.error, "Unable to load chat read state");

  const messages = (messagesResult.data ?? []) as MessageRow[];
  const messageIds = messages.map((message) => message.id);
  const reactionsResult = messageIds.length
    ? await supabase.from("chat_reactions").select("message_id, member_id, emoji").in("message_id", messageIds)
    : { data: [] as ReactionRow[], error: null };
  throwOnSupabaseError(reactionsResult.error, "Unable to load chat reactions");
  const reactions = (reactionsResult.data ?? []) as ReactionRow[];
  const memberships = (membersResult.data ?? []) as { channel_id: string; member_id: string }[];
  const reads = new Map(
    ((readsResult.data ?? []) as { channel_id: string; last_read_at: string }[]).map((row) => [
      row.channel_id,
      row.last_read_at,
    ])
  );

  return ((channelsResult.data ?? []) as ChannelRow[])
    .map((channel) => ({
      id: channel.id,
      name: channel.name,
      kind: channel.kind,
      createdBy: channel.created_by ?? undefined,
      contextId: channel.context_id ?? undefined,
      archivedAt: channel.archived_at ?? undefined,
      rotaryYear: channel.rotary_year ?? undefined,
      memberIds: memberships
        .filter((membership) => membership.channel_id === channel.id)
        .map((membership) => membership.member_id),
      lastReadAt: reads.get(channel.id),
      messages: messages
        .filter((message) => message.channel_id === channel.id)
        .map((message) => toMessage(message, reactions)),
      hasEarlierMessages: messages.some((message) => message.channel_id === channel.id && Number(message.total_count) > 50),
    }))
    .sort((a, b) => {
      if (a.kind === "club") return -1;
      if (b.kind === "club") return 1;
      const aLast = a.messages.at(-1)?.createdAt ?? "";
      const bLast = b.messages.at(-1)?.createdAt ?? "";
      return bLast.localeCompare(aLast) || a.name.localeCompare(b.name);
    });
}
