import type { ChatChannel, ChatMessage } from "@/lib/data/chat";
import { toClubDateString } from "@/lib/format";

export function isUnread(message: ChatMessage, memberId: string, lastReadAt?: string) {
  return !message.deletedAt && message.senderId !== memberId && (!lastReadAt || message.createdAt > lastReadAt);
}
export function sortConversations(channels: ChatChannel[]) {
  return [...channels].sort((a, b) => Number(b.kind === "club") - Number(a.kind === "club") || (b.messages.at(-1)?.createdAt ?? "").localeCompare(a.messages.at(-1)?.createdAt ?? "") || a.name.localeCompare(b.name));
}
export function chatDayLabel(iso: string, now = new Date()) {
  const day = toClubDateString(iso);
  if (day === toClubDateString(now.toISOString())) return "Today";
  if (day === toClubDateString(new Date(now.getTime() - 86400000).toISOString())) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-US", { timeZone: "America/Tortola", month: "short", day: "numeric", year: "numeric" });
}
export function chatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { timeZone: "America/Tortola", hour: "numeric", minute: "2-digit" });
}
export function escapeChatSearch(query: string) {
  return query.replace(/[\\%_]/g, "\\$&");
}
