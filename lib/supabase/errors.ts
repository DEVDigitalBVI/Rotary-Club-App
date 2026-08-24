/** Database reads must fail loudly instead of turning outages, schema drift,
 * or denied queries into convincing empty states. The original Supabase error
 * stays attached as the cause for server logs without being sent to clients. */
export function throwOnSupabaseError(error: unknown, message: string) {
  if (error) throw new Error(message, { cause: error });
}
