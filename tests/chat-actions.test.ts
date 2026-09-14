import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadChatContextAction, markChatReadAction, searchChatMessagesAction, sendChatMessageAction } from "../app/(app)/chat/actions";
const mocks = vi.hoisted(() => ({ member: vi.fn(), from: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/data/members", () => ({ getCurrentMember: mocks.member }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: mocks.from }) }));
function builder(data: unknown = [], error: unknown = null) {
  const result: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["insert", "select", "eq", "is", "ilike", "order", "range", "single", "lt", "gte", "neq", "limit", "upsert"]) result[method] = vi.fn(() => result);
  result.then = vi.fn((resolve: (value: unknown) => void) => resolve({ data, error }));
  return result;
}
beforeEach(() => { vi.clearAllMocks(); mocks.member.mockResolvedValue({ id: "me" }); });
describe("chat search", () => {
  it("requires authentication before querying", async () => {
    mocks.member.mockResolvedValue(null);
    await expect(searchChatMessagesAction("channel", "meeting")).rejects.toThrow("signed in");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it.each([["", 0], ["a".repeat(201), 0], ["meeting", -1], ["meeting", 1.5]])("rejects invalid search input", async (query, offset) => {
    await expect(searchChatMessagesAction("channel", String(query), Number(offset))).rejects.toThrow("Invalid search");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("scopes literal search to a channel and paginates stored history", async () => {
    const db = builder(); mocks.from.mockReturnValue(db);
    await searchChatMessagesAction("channel", "  50%  ", 50);
    expect(db.eq).toHaveBeenCalledWith("channel_id", "channel");
    expect(db.is).toHaveBeenCalledWith("deleted_at", null);
    expect(db.ilike).toHaveBeenCalledWith("body", "%50\\%%");
    expect(db.range).toHaveBeenCalledWith(50, 99);
    expect(db.order).toHaveBeenCalledWith("id", { ascending: false });
  });
  it("reports a failed query instead of an empty result", async () => {
    mocks.from.mockReturnValue(builder(null, { message: "failed" }));
    await expect(searchChatMessagesAction("c", "meeting")).rejects.toThrow("Unable to search");
  });
  it("does not load context for an inaccessible message", async () => {
    const db = builder(null, { message: "not visible" }); mocks.from.mockReturnValue(db);
    await expect(loadChatContextAction("channel", "message")).rejects.toThrow("no longer available");
    expect(db.eq).toHaveBeenCalledWith("channel_id", "channel");
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });
});
describe("chat read receipts", () => {
  it("records the last displayed message time rather than the request time", async () => {
    const db = builder(); mocks.from.mockReturnValue(db);
    await markChatReadAction("channel", "2026-01-01T00:00:00Z");
    expect(db.upsert).toHaveBeenCalledWith({ channel_id: "channel", member_id: "me", last_read_at: "2026-01-01T00:00:00Z" });
  });
  it.each(["invalid", "2999-01-01T00:00:00Z"])("rejects an invalid read cursor", async (through) => {
    const db = builder(); mocks.from.mockReturnValue(db);
    await expect(markChatReadAction("channel", through)).rejects.toThrow("Invalid read time");
    expect(db.upsert).not.toHaveBeenCalled();
  });
});

describe("message retries", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const row = { id, channel_id: "c", sender_id: "me", body: "Hello", reply_to_id: null, edited_at: null, deleted_at: null, created_at: "2026-01-01T00:00:00Z" };
  it("reuses a client message ID when sending", async () => {
    const db = builder(row); mocks.from.mockReturnValue(db);
    await expect(sendChatMessageAction("c", "Hello", undefined, id)).resolves.toEqual(row);
    expect(db.insert).toHaveBeenCalledWith({ id, channel_id: "c", sender_id: "me", body: "Hello", reply_to_id: null });
  });
  it("returns the original message after a successful send with a lost response", async () => {
    const existing = builder(row);
    mocks.from.mockReturnValueOnce(builder(null, { code: "23505" })).mockReturnValueOnce(existing);
    await expect(sendChatMessageAction("c", "Hello", undefined, id)).resolves.toEqual(row);
    expect(existing.eq).toHaveBeenCalledWith("sender_id", "me");
    expect(existing.eq).toHaveBeenCalledWith("channel_id", "c");
  });
  it("rejects a collision with different message content", async () => {
    mocks.from.mockReturnValueOnce(builder(null, { code: "23505" })).mockReturnValueOnce(builder({ ...row, body: "Different" }));
    await expect(sendChatMessageAction("c", "Hello", undefined, id)).rejects.toThrow("Unable to send");
  });
});
