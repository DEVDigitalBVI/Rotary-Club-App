import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Where every emailed auth link (password reset today; signup confirmation
 * could route through here too) lands. verifyOtp exchanges the token for a
 * real session and sets it via cookies, so by the time `next` loads the
 * member is signed in — recovery links included, which is what lets
 * /update-password work without a separate "enter your old password" step.
 */
// Only an in-app relative path is a safe redirect target. `next` comes
// straight from a public query string, so anything else — a protocol-
// relative "//evil.com", an absolute URL, or the "@" userinfo trick
// ("https://ourapp.com@evil.com") — must be rejected rather than
// concatenated into the redirect.
function isSafeRedirectPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const requestedNext = searchParams.get("next") ?? "/dashboard";
  const next = isSafeRedirectPath(requestedNext) ? requestedNext : "/dashboard";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      await supabase.rpc("claim_member");
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link-expired`);
}
