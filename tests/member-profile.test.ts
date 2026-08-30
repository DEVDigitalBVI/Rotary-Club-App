import { describe, expect, it } from "vitest";
import { getMissingMemberProfileFields } from "../lib/member-profile";

describe("member profile completion", () => {
  it("reports each missing field with its ownership", () => {
    expect(getMissingMemberProfileFields({
      phone: "",
      classification: "  ",
      bio: null,
    })).toEqual([
      { key: "phone", label: "Phone number", selfService: true },
      { key: "classification", label: "Classification", selfService: true },
      { key: "bio", label: "Short introduction", selfService: true },
    ]);
  });

  it("treats a profile with all required text as complete", () => {
    expect(getMissingMemberProfileFields({
      phone: "(284) 555-0123",
      classification: "Education",
      bio: "Club member and volunteer.",
    })).toEqual([]);
  });
});
