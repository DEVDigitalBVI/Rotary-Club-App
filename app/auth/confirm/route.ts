import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Where every emailed auth link (password reset or member invitation) lands.
 * Supabase can return either a PKCE
 * authorization code from its default ConfirmationURL or a token hash from a
 * customized server-side email template. Both paths must exchange the link
 * for a cookie-backed session before `next` loads.
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
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Recovery links establish a signed-in session before this callback runs.
  // If Supabase's hosted verification step drops the nested `next` query
  // parameter, default to the password form instead of treating recovery as a
  // normal login and sending the member to the dashboard.
  const recoveryFallback = code || type === "recovery"
    ? "/update-password"
    : "/dashboard";
  const requestedNext = searchParams.get("next") ?? recoveryFallback;
  const next = isSafeRedirectPath(requestedNext) ? requestedNext : "/dashboard";

  const supabase = await createClient();
  if (code) {
    const flowId = searchParams.get("sb_flow_id");
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined
    );
    if (!error) {
      await supabase.rpc("claim_member");
      return NextResponse.redirect(`${origin}${next}`);
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      await supabase.rpc("claim_member");
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link-expired`);
}
