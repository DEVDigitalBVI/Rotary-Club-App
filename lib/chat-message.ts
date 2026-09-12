import type { ChatMessage } from "@/lib/data/chat";

export type MessageRow = {
  id: string;
  channel_id: string;
  sender_id: string;
  body: string;
  reply_to_id: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
};
export type ReactionRow = { message_id: string; member_id: string; emoji: string };

export function toMessage(row: MessageRow, reactions: ReactionRow[]): ChatMessage {
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

