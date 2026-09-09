import { describe, expect, it } from "vitest";
import { rotaryYear, summarizePersonalHours, upcomingPersonalRsvps } from "../lib/my-rotary";
import type { EventItem } from "../lib/mock-data";

describe("My Rotary summaries", () => {
  it("rolls the Rotary year over on July 1", () => {
    expect(rotaryYear("2026-06-30")).toEqual({ start: "2025-07-01", end: "2026-07-01", label: "2025–26" });
    expect(rotaryYear("2026-07-01")).toEqual({ start: "2026-07-01", end: "2027-07-01", label: "2026–27" });
  });

  it("counts all recorded hours regardless of legacy approval status", () => {
    expect(summarizePersonalHours([
      { hours: "2.5", approved_at: "2026-09-08" },
      { hours: 1.25, approved_at: null },
      { hours: "3", approved_at: "2026-09-08" },
    ])).toEqual({ total: 6.75 });
    expect(summarizePersonalHours([])).toEqual({ total: 0 });
  });

  it("shows only personal upcoming commitments, ordered by instant", () => {
    const event = (id: string, startsAt: string, myRsvp: EventItem["myRsvp"], endsAt?: string) => ({ id, startsAt, myRsvp, endsAt }) as EventItem;
    const rows = [
      event("later", "2026-09-09T22:00:00Z", "yes"),
      event("past", "2026-09-09T10:00:00Z", "yes"),
      event("declined", "2026-09-09T21:00:00Z", "no"),
      event("unanswered", "2026-09-09T21:00:00Z", "none"),
      event("maybe", "2026-09-09T21:00:00Z", "maybe"),
      event("ongoing", "2026-09-09T18:00:00Z", "yes", "2026-09-09T21:00:00Z"),
    ];
    expect(upcomingPersonalRsvps(rows, new Date("2026-09-09T20:00:00Z")).map((row) => row.id)).toEqual(["ongoing", "maybe", "later"]);
  });
});
