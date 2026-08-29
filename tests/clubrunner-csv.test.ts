import { describe, expect, it } from "vitest";
import { parseClubRunnerCsv } from "../lib/clubrunner-csv";

describe("ClubRunner CSV import", () => {
  it("accepts common ClubRunner headings and quoted values", () => {
    const result = parseClubRunnerCsv(
      'First Name,Last Name,Email Address,Classification,Date Joined\r\nAlthea,Francis,ALTHEA@example.com,"Law, Civil",8/15/2018'
    );

    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      expect.objectContaining({
        name: "Althea Francis",
        email: "althea@example.com",
        classification: "Law, Civil",
        joinDate: "2018-08-15",
      }),
    ]);
  });

  it("rejects duplicate emails instead of applying an ambiguous update", () => {
    const result = parseClubRunnerCsv(
      "Name,Email\nOne Member,same@example.com\nAnother Member,SAME@example.com"
    );

    expect(result.rows).toHaveLength(1);
    expect(result.errors[0]).toContain("appears more than once");
  });

  it("requires identifiable name and email columns", () => {
    const result = parseClubRunnerCsv("Person,Contact\nSomeone,someone@example.com");

    expect(result.rows).toEqual([]);
    expect(result.errors).toHaveLength(2);
  });
});
