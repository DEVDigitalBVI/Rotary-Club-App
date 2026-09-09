import { beforeEach, describe, expect, it, vi } from "vitest";
import { getEvents } from "../lib/data/events";
import { GET } from "../app/(app)/events/calendar.ics/route";

const mocks = vi.hoisted(() => ({ events: vi.fn(), rsvps: vi.fn() }));
vi.mock("@/lib/data/members", () => ({ getCurrentMember: async () => ({ id: "waiting", status: "active" }) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  from: () => ({ select: () => ({ order: () => ({ returns: mocks.events }) }) }),
  rpc: () => ({ overrideTypes: mocks.rsvps }),
}) }));

beforeEach(() => {
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
    const response = await GET();
    const ics = await response.text();
    expect(ics).toContain("DTSTART:20260910T020000Z\r\n");
    expect(ics).toContain("DTEND:20260910T030000Z\r\n");
  });
});
