import { beforeEach, describe, expect, it, vi } from "vitest";
import { getEventOptions, getEvents } from "../lib/data/events";
import { GET } from "../app/(app)/events/calendar.ics/route";

const mocks = vi.hoisted(() => ({ events: vi.fn(), rsvps: vi.fn(), select: vi.fn(), member: vi.fn() }));
vi.mock("@/lib/data/members", () => ({ getCurrentMember: mocks.member }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  from: () => ({ select: (columns: string) => { mocks.select(columns); return { order: () => ({ returns: mocks.events }) }; } }),
  rpc: () => ({ overrideTypes: mocks.rsvps }),
}) }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.member.mockResolvedValue({ id: "waiting", status: "active" });
  mocks.events.mockResolvedValue({ error: null, data: [{
    id: "meeting", title: "Evening meeting", starts_at: "2026-09-10T02:00:00Z",
    ends_at: "2026-09-10T03:00:00Z", attendance_present: null, attendance_total: null,
  }] });
  mocks.rsvps.mockResolvedValue({ error: null, data: [
    { event_id: "meeting", member_id: "confirmed", status: "yes", registration_status: "registered", guest_count: 2 },
    { event_id: "meeting", member_id: "waiting", status: "yes", registration_status: "waitlisted", guest_count: 4 },
    { event_id: "meeting", member_id: "maybe", status: "maybe", registration_status: "registered", guest_count: 0 },
  ] });
});

describe("event display and export", () => {
  it("separates the waitlist from confirmed members and guests", async () => {
    const [event] = await getEvents();
    expect(event.rsvps).toEqual({ yes: 1, no: 0, maybe: 1, guests: 2, waitlisted: 1 });
    expect(event.attendeeIds).toEqual(["confirmed"]);
    expect(event.attendeeGuestCounts).toEqual({ confirmed: 2 });
    expect(event.registration?.status).toBe("waitlisted");
    expect(event.date).toBe("2026-09-09");
    expect(event.time).toBe("10:00 PM – 11:00 PM");
  });

  it("exports the original UTC start and end, including a BVI date boundary", async () => {
    // A calendar must remain downloadable even if the RSVP endpoint fails.
    mocks.rsvps.mockRejectedValue(new Error("RSVP service unavailable"));
    const response = await GET();
    const ics = await response.text();
    expect(ics).toContain("DTSTART:20260910T020000Z\r\n");
    expect(ics).toContain("DTEND:20260910T030000Z\r\n");
    expect(mocks.rsvps).not.toHaveBeenCalled();
    expect(mocks.select).toHaveBeenCalledWith("id,title,starts_at,ends_at,location,description");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("does not load calendar records for signed-out or inactive members", async () => {
    for (const member of [null, { id: "inactive", status: "inactive" }]) {
      mocks.member.mockResolvedValue(member);
      expect((await GET()).status).toBe(401);
    }
    expect(mocks.events).not.toHaveBeenCalled();
  });

  it("loads event audience names without RSVP or member queries", async () => {
    const options = [{ id: "meeting", title: "Evening meeting" }];
    mocks.events.mockResolvedValue({ data: options, error: null });
    expect(await getEventOptions()).toEqual(options);
    expect(mocks.select).toHaveBeenCalledWith("id,title");
    expect(mocks.rsvps).not.toHaveBeenCalled();
    expect(mocks.member).not.toHaveBeenCalled();
  });

  it("reports a failed audience lookup instead of showing an empty picker", async () => {
    mocks.events.mockResolvedValue({ data: null, error: { message: "denied" } });
    await expect(getEventOptions()).rejects.toThrow("Unable to load event names");
  });
});
