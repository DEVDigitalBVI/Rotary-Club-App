import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Auth administration must never share the browser/server-session client:
 * this key bypasses RLS and is only used after the calling member has been
 * authenticated and authorized by the Server Action.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secret) {
    throw new Error("Supabase Auth administration is not configured.");
  }

  return createClient(url, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
