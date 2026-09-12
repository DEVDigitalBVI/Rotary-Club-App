import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateRsvpAction } from "../app/(app)/events/actions";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), member: vi.fn(), revalidate: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/data/members", () => ({ getCurrentMember: mocks.member }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: mocks.rpc, from: mocks.from }) }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.member.mockResolvedValue({ id: "member" });
  mocks.rpc.mockResolvedValue({ data: "registered", error: null });
});

describe("RSVP writes", () => {
  it("requires a signed-in member", async () => {
    mocks.member.mockResolvedValue(null);
    expect(await updateRsvpAction("event", "yes")).toEqual({ error: "You must be signed in." });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it.each(["registered", "waitlisted"])("refreshes event views after a %s RSVP", async (registration) => {
    mocks.rpc.mockResolvedValue({ data: registration, error: null });
    expect(await updateRsvpAction("event", "yes", { guestCount: 2, dietaryNotes: " Vegetarian " })).toEqual({ success: true });
    expect(mocks.rpc).toHaveBeenCalledWith("change_event_rsvp", { p_event: "event", p_status: "yes", p_guests: 2, p_dietary: "Vegetarian" });
    expect(mocks.revalidate.mock.calls).toEqual([["/events/event"], ["/events"], ["/dashboard"]]);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it.each(["PGRST202", "42883"])("does not bypass the RPC when it is missing (%s)", async (code) => {
    mocks.rpc.mockResolvedValue({ error: { code, message: "Function missing" } });
    expect(await updateRsvpAction("event", "yes")).toEqual({ error: "Couldn't update your RSVP." });
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("preserves the database's deadline error", async () => {
    mocks.rpc.mockResolvedValue({ error: { code: "P0001", message: "The RSVP deadline has passed" } });
    expect(await updateRsvpAction("event", "yes")).toEqual({ error: "The RSVP deadline has passed" });
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
