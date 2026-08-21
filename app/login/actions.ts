"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = { error: string } | undefined;

/**
 * The Origin header is present on same-site form/fetch requests (which is
 * how server actions post), so this covers local dev and any deployment
 * without needing a hardcoded site URL env var. Falls back to the Host
 * header for the rare client that omits Origin.
 */
async function getOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
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
  await supabase.rpc("claim_member");

  redirect("/dashboard");
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();

  // Closed signup: only emails an officer already added to the roster (and
  // hasn't been claimed by another account yet) may create a login. Checked
  // via RPC rather than a direct select — members isn't readable by anon.
  const { data: eligible } = await supabase.rpc("email_is_signup_eligible", {
    target_email: email,
  });

  if (!eligible) {
    return {
      error:
        "That email isn't on the club roster yet. Ask your secretary to add you first.",
    };
  }

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?check-email=1");
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

  const supabase = await createClient();
  const origin = await getOrigin();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/update-password`,
  });

  redirect("/login?check-email=reset");
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

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Couldn't update your password — try the reset link again." };
  }

  redirect("/dashboard");
}
