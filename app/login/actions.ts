"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = { error: string } | undefined;

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
