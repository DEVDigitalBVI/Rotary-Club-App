"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  getPasswordUpdateErrorMessage,
  meetsPasswordRequirements,
} from "@/lib/password-policy";

export type AuthFormState =
  | { error?: string; success?: string }
  | undefined;

/**
 * The Origin header is present on same-site form/fetch requests (which is
 * how server actions post), so this covers local dev and any deployment
 * without needing a hardcoded site URL env var. Deliberately does NOT fall
 * back to the Host/X-Forwarded-Host header — those are attacker-controlled
 * on a raw, non-browser request, and trusting them here would let someone
 * steer the password-reset link mailed to a victim toward an arbitrary
 * domain.
 */
async function getOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) {
    throw new Error("Missing Origin header");
  }

  const url = new URL(origin);
  // Supabase only accepts password-reset redirects that exactly match its
  // allow list. Production traffic is served on www, while the canonical
  // Auth callback is registered on the apex domain. Use that registered
  // origin so Supabase does not silently fall back to the Site URL (/login).
  if (url.hostname === "www.rotaryclubroadtown.com") {
    url.hostname = "rotaryclubroadtown.com";
  }

  return url.origin;
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Incorrect email or password." };
  }

  // Link this login to the roster row an officer already added, if it
  // hasn't been claimed yet. Harmless no-op otherwise.
  const { error: linkError } = await supabase.rpc("claim_member");
  if (linkError) return { error: "You signed in, but we couldn’t connect your club profile. Please try signing in again. If this continues, contact the club secretary." };

  redirect("/dashboard");
}

/**
 * Always redirects to the same "check your email" state whether or not the
 * address is on file — confirming or denying an account here would let
 * someone enumerate club members by email address.
 */
export async function requestPasswordReset(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Enter your email." };
  }

  let origin: string;
  try {
    origin = await getOrigin();
  } catch {
    return { error: "Couldn't process that request — please try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/update-password`,
  });

  if (error) {
    if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return {
        error:
          "Too many reset emails have been requested. Please wait about an hour before trying again.",
      };
    }

    return {
      error: "We couldn't send a reset email right now. Please try again later.",
    };
  }

  // Keep the response identical for registered and unknown addresses so this
  // form cannot be used to discover which emails have accounts.
  return {
    success:
      "If that email has an account, a password-reset link is on its way. Check your inbox and spam folder.",
  };
}

/**
 * Sets a new password for the signed-in session — either a short-lived
 * recovery session from a reset-password link (see app/auth/confirm), or a
 * member's normal session if they just want to change their password.
 */
export async function updatePassword(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password !== confirmPassword) {
    return { error: "The passwords do not match. Enter the same password in both fields." };
  }

  if (!meetsPasswordRequirements(password)) {
    return {
      error:
        "Password must have at least 8 characters, including an uppercase letter, lowercase letter, number, and symbol.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    const reasons = "reasons" in error && Array.isArray(error.reasons)
      ? error.reasons.filter((reason): reason is string => typeof reason === "string")
      : [];
    return { error: getPasswordUpdateErrorMessage(error.code, reasons) };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
