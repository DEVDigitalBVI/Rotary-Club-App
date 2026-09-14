import { describe, expect, it } from "vitest";
import { chatDayLabel, chatTime, escapeChatSearch, isUnread, sortConversations } from "../lib/chat-display";
import type { ChatChannel, ChatMessage } from "../lib/data/chat";
const message = { id: "m", channelId: "c", senderId: "other", body: "Hello", createdAt: "2026-09-12T01:00:00Z", reactions: [] } satisfies ChatMessage;

describe("chat display behavior", () => {
  it("uses the Tortola date around midnight UTC", () => {
    expect(chatDayLabel(message.createdAt, new Date("2026-09-12T03:00:00Z"))).toBe("Today");
    expect(chatDayLabel(message.createdAt, new Date("2026-09-12T05:00:00Z"))).toBe("Yesterday");
    expect(chatTime(message.createdAt)).toBe("9:00 PM");
  });
  it("does not count own, removed, or already read messages as unread", () => {
    expect(isUnread(message, "me")).toBe(true);
    expect(isUnread(message, "other")).toBe(false);
    expect(isUnread({ ...message, deletedAt: message.createdAt }, "me")).toBe(false);
    expect(isUnread(message, "me", message.createdAt)).toBe(false);
    expect(isUnread(message, "me", "2026-09-11T01:00:00Z")).toBe(true);
  });
  it("pins Clubhouse and sorts other rooms by recent activity without mutating input", () => {
    const room = (id: string, kind: ChatChannel["kind"], messages: ChatMessage[]): ChatChannel => ({ id, name: id, kind, messages, memberIds: [], hasEarlierMessages: false });
    const channels = [room("old", "dm", []), room("new", "committee", [message]), room("club", "club", [])];
    expect(sortConversations(channels).map((channel) => channel.id)).toEqual(["club", "new", "old"]);
    expect(channels[0].id).toBe("old");
  });
  it("treats SQL wildcard characters as literal search text", () => {
    expect(escapeChatSearch("100%_done\\yes")).toBe("100\\%\\_done\\\\yes");
    expect(escapeChatSearch("club's meeting")).toBe("club's meeting");
  });
});
