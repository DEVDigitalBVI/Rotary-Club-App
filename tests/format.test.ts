import { describe, expect, it } from "vitest";
import { daysBetween, formatTime, initialsFromName, toClubDateString } from "../lib/format";
import { daysBefore } from "../lib/mock-data";

describe("club date rules", () => {
  it("uses the BVI calendar day for UTC instants around midnight", () => {
    expect(toClubDateString("2026-08-24T02:00:00Z")).toBe("2026-08-23");
    expect(toClubDateString("2026-08-24T05:00:00Z")).toBe("2026-08-24");
  });

  it("counts calendar days without depending on the machine timezone", () => {
    expect(daysBetween("2026-06-30", "2026-07-01")).toBe(1);
    expect(daysBefore("2026-03-01", 1)).toBe("2026-02-28");
  });
});

describe("member display rules", () => {
  it("creates stable two-letter initials", () => {
    expect(initialsFromName("Althea Francis")).toBe("AF");
    expect(initialsFromName("Jamaal Devon Hodge")).toBe("JD");
  });
});

it("formats event times in BVI regardless of the server timezone", () => {
  expect(formatTime("2026-09-09T22:00:00Z")).toBe("6:00 PM");
});
