# Google Calendar Setup (OAuth, per-user, two-way sync)

The planner syncs with the **logged-in user's** own Google Calendar via
OAuth 2.0 + PKCE — **no `.env` variables are needed for Google.** Each user
connects their own account once, after which the planner:

- shows today's calendar events in the "What are you doing today?" header, and
- pushes each study session to the primary calendar as an **all-day event**
  (kept in sync when you add, complete, or delete a session).

The only configuration is the Google OAuth **client_id** and **client_secret**,
stored once in the `google_oauth_settings` table. Everything else lives in the
app:

- `src/app/auth/google-calendar/route.ts` — starts the OAuth flow (PKCE)
- `src/app/auth/google-calendar/callback/route.ts` — exchanges the code and
  stores each user's refresh token
- `src/lib/gcal.ts` — reads and writes events via the user's stored token
- `src/app/(app)/planner/actions.ts` — pushes/updates/deletes events and
  reconciles session dates from the calendar

## 1. Create a Google OAuth client

1. Go to <https://console.cloud.google.com/> and create (or pick) a project.
2. Enable the **Google Calendar API**:
   APIs & Services → Library → search "Google Calendar API" → Enable.
3. APIs & Services → **OAuth consent screen** → configure the app
   (External, add your email as a test user if the app is in testing mode).
4. APIs & Services → **Credentials** → **Create credentials → OAuth client ID**.
   - Application type: **Web application**
   - **Authorized redirect URIs** — add BOTH:
     - `http://localhost:3000/auth/google-calendar/callback`
     - `https://<your-production-domain>/auth/google-calendar/callback`
   - Copy the **Client ID** and **Client secret**.

## 2. Store the client_id and client_secret in Supabase

Run once in the Supabase **SQL editor** (run with postgres privileges, so it
works even though the table has no app-level insert policy). Do **not** use
the Table Editor — in recent Supabase versions it runs with the user's
authenticated role, which RLS blocks for writes on this table.

```sql
INSERT INTO public.google_oauth_settings (id, client_id, client_secret)
VALUES (1, 'YOUR_CLIENT_ID.apps.googleusercontent.com', 'YOUR_CLIENT_SECRET')
ON CONFLICT (id) DO UPDATE
  SET client_id = EXCLUDED.client_id,
      client_secret = EXCLUDED.client_secret;
```

The client_id is public (it's embedded in every OAuth request). The
**client_secret** is stored in the same table — readable by authenticated
users, which is an accepted trade-off — rather than in a `.env` file. Google
requires it for "Web application" OAuth clients even with PKCE (the token
endpoint rejects requests without it). The secret alone is not enough to mint
a token: an attacker would still need the victim's authorization code plus the
PKCE verifier, which lives in a short-lived httpOnly cookie.

### Vercel + Supabase (production)

- The app is deployed on Vercel; Supabase is the hosted backend.
- **No Vercel environment variables are needed for Google** — the app reads
  `client_id`/`client_secret` from the Supabase table and auto-detects the
  callback origin from each request.
- Register the production callback in the Google OAuth client (step 1):
  `https://<your-domain>.vercel.app/auth/google-calendar/callback`
- If you keep both a custom domain and `*.vercel.app` live, register **both**
  callback URIs — a user reaching the site through either URL must hit a
  matching registered redirect.
- **Vercel Preview / branch deploys** get a random `*.vercel.app` URL that
  can't be pre-registered. On previews Google Calendar will gracefully fall
  back to the "Connect" state; the rest of the planner is unaffected.

## 3. Done

Reload `/planner` and click **Connect Google Calendar**. The browser opens
Google's consent screen; after approving, the user's refresh token is stored
in `user_google_tokens` and today's events appear in the header.

From then on, sessions you schedule in the planner are pushed to the primary
calendar automatically (see "How it works" below). If you connected before
this integration had write access (the old `calendar.readonly` scope), the
header shows a **"Re-connect to enable syncing sessions to your calendar"**
banner — click it once to grant the new scope.

## How it works (quick notes)

- **Scope**: `https://www.googleapis.com/auth/calendar.events` (read + write).
  Users who connected with the old read-only scope must **re-connect once**;
  the planner detects the stale scope and shows a re-connect banner.
- **Calendar**: always the user's own `primary` calendar — no calendar ID to
  configure.
- **All-day events**: a session is pushed as an all-day event on its date (no
  start time). `duration_min` is not reflected in the calendar event.
- **Marker + event id**: each pushed event's description contains the marker
  `[IELTS-PLANNER:<session-uuid>]`; the planner stores the returned Google
  event id in `study_plan_items.gcal_event_id` so it can update or delete the
  event later.
- **Auto-sync**: creating, completing/toggling, or deleting a session updates
  the matching calendar event. Toggling completion adds or removes a leading
  `✓ ` in the event title.
- **Backfill**: a **"Sync all to calendar"** button in the header pushes any
  session that has no `gcal_event_id` yet (e.g. sessions created before you
  connected, or ones whose push failed) to the calendar.
- **Two-way dates (calendar wins)**: if you drag an event to another day in
  Google Calendar, the planner updates the session's date on the next planner
  load — the calendar is the source of truth for dates.
- **PKCE**: the code verifier lives in a short-lived httpOnly cookie; only the
  challenge is sent to Google.
- **Tokens**: a refresh token is stored per user in `user_google_tokens`
  (RLS-scoped to the owner); access tokens are refreshed automatically.
- If a user's token is revoked (or Google returns an error), the header falls
  back to the "Connect" state so they can re-connect.

## Troubleshooting

- **"Google Calendar not configured"** → `google_oauth_settings` is empty, or
  `client_id`/`client_secret` is blank. Run the INSERT above.
- **`redirect_uri` mismatch** → the redirect URI must exactly match one
  registered in the OAuth client. Add both localhost and production URIs.
- **Connection always fails / no refresh token** → make sure the OAuth consent
  screen is out of "Testing" mode (or your Google account is a test user), and
  that `prompt=consent` + `access_type=offline` are honored (they are, by the
  auth URL builder).
- **Sessions don't appear in the calendar** → confirm the stored scope is
  `calendar.events` (not the old read-only scope) and re-connect if the header
  shows the re-connect banner; then use **"Sync all to calendar"** to backfill
  any session that has no `gcal_event_id` yet.
