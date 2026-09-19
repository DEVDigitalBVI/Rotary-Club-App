import { describe, expect, it } from "vitest";
import {
  getPasswordChecks,
  getPasswordUpdateErrorMessage,
  meetsPasswordRequirements,
} from "../lib/password-policy";

describe("password policy", () => {
  it("requires length, uppercase, lowercase, number, and symbol", () => {
    expect(getPasswordChecks("short")).toEqual({
      length: false,
      lowercase: true,
      uppercase: false,
      number: false,
      symbol: false,
    });
    expect(meetsPasswordRequirements("Secure1!")).toBe(true);
    expect(meetsPasswordRequirements("SecurePassword1")).toBe(false);
  });

  it("provides a clear message when the current password is reused", () => {
    expect(getPasswordUpdateErrorMessage("same_password")).toContain(
      "can’t reuse your current password"
    );
  });

  it("explains the full policy for weak passwords", () => {
    expect(getPasswordUpdateErrorMessage("weak_password")).toContain(
      "uppercase letter, lowercase letter, number, and symbol"
    );
  });

  it("identifies passwords exposed in a known breach", () => {
    expect(getPasswordUpdateErrorMessage("weak_password", ["pwned"])).toContain(
      "known data breach"
    );
  });
});
