export const PASSWORD_REQUIREMENTS = [
  { key: "length", label: "At least 8 characters" },
  { key: "lowercase", label: "One lowercase letter" },
  { key: "uppercase", label: "One uppercase letter" },
  { key: "number", label: "One number" },
  { key: "symbol", label: "One symbol" },
] as const;

export type PasswordRequirement = (typeof PASSWORD_REQUIREMENTS)[number]["key"];

const ALLOWED_SYMBOLS = new Set(
  Array.from("!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~")
);

export function getPasswordChecks(password: string): Record<PasswordRequirement, boolean> {
  return {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: Array.from(password).some((character) => ALLOWED_SYMBOLS.has(character)),
  };
}

export function meetsPasswordRequirements(password: string): boolean {
  return Object.values(getPasswordChecks(password)).every(Boolean);
}

export function getPasswordUpdateErrorMessage(
  code?: string,
  reasons: string[] = []
): string {
  if (code === "same_password") {
    return "You can’t reuse your current password. Choose a different password for your account.";
  }

  if (code === "weak_password") {
    if (reasons.includes("pwned")) {
      return "That password has appeared in a known data breach. Choose a different, unique password.";
    }

    return "That password doesn’t meet the security requirements. Use at least 8 characters with an uppercase letter, lowercase letter, number, and symbol.";
  }

  return "Couldn’t update your password. Please request a new reset link and try again.";
}
