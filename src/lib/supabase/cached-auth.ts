import { cache } from "react";
import { createClient } from "./server";

/**
 * React cache()-wrapped getUser(). Deduplicates auth calls within
 * a single server render tree — multiple components calling this
 * in one request only trigger ONE Supabase round-trip.
 *
 * Note: Request-scoped only. No cross-user leakage risk.
 * Middleware runs in Edge runtime (separate context) — not affected.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
