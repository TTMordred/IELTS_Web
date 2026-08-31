-- Google Calendar OAuth integration (per-user connect, no .env for Google).
-- Two tables:
--   1) google_oauth_settings  — single row (id=1) holding the Google OAuth
--      client_id AND client_secret. Set once via the SQL editor / psql.
--      NOTE: Google requires the client_secret for "Web application" OAuth
--      clients even with PKCE (the docs mark it optional, but the token
--      endpoint rejects requests without it: "client_secret is missing.").
--      We store it in the DB so no environment variables are needed. It is
--      readable by authenticated users, which is an accepted trade-off here:
--      an attacker with the secret still needs the victim's authorization
--      code + PKCE verifier (httpOnly cookie) to mint a token.
--   2) user_google_tokens     — per-user refresh token, RLS-scoped to owner.

-- ─── Settings ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.google_oauth_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  client_id text NOT NULL DEFAULT '',
  client_secret text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.google_oauth_settings ENABLE ROW LEVEL SECURITY;

-- Both fields are readable by any authenticated user (incl. the server).
-- client_id is public by nature; client_secret is an accepted trade-off (see
-- header comment) — keeping it out of .env is the point of this design.
CREATE POLICY "settings_readable_by_authenticated"
  ON public.google_oauth_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Writes are restricted to postgres / service_role (bypass RLS). No app-level
-- write policy is created on purpose: only an admin sets the credentials.
--
-- NOTE: set them via the Supabase SQL editor (runs as postgres, bypasses RLS)
-- or psql as postgres/service_role. Do NOT use the Table Editor — it runs
-- with the authenticated role, which RLS blocks here.
-- Example:
--   INSERT INTO public.google_oauth_settings (id, client_id, client_secret)
--   VALUES (1, 'your-client-id.apps.googleusercontent.com', 'your-client-secret')
--   ON CONFLICT (id) DO UPDATE
--     SET client_id = EXCLUDED.client_id, client_secret = EXCLUDED.client_secret;

-- ─── Per-user tokens ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_google_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token text NOT NULL,
  access_token text,
  token_expires_at timestamptz,
  scope text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_google_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_owns_google_token"
  ON public.user_google_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Grants (new tables don't inherit the earlier "ALL TABLES" grant) ─────

GRANT SELECT ON public.google_oauth_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_google_tokens TO authenticated;
