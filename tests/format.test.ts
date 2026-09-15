import { describe, expect, it } from "vitest";
import { formatTime, initialsFromName, toClubDateString } from "../lib/format";

describe("club date rules", () => {
  it("uses the BVI calendar day for UTC instants around midnight", () => {
    expect(toClubDateString("2026-08-24T02:00:00Z")).toBe("2026-08-23");
    expect(toClubDateString("2026-08-24T05:00:00Z")).toBe("2026-08-24");
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
