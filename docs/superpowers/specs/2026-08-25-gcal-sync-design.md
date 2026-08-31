# Google Calendar ↔ Planner Two-Way Sync

## Status

Design approved in brainstorming. Not yet implemented. No commits (user commits manually).

## Context

The planner today treats Google Calendar as a read-only source: `getTodayEvents()`
fetches today's events (scope `calendar.readonly`) and a manual "Sync into planner"
button imports them as `study_plan_items` rows.

The direction is now reversed and made two-way. A planner session pushes an
all-day event into the user's primary Google Calendar. Every pushed event carries
a private marker in its description that identifies the originating planner
session. The app reads that marker back to (1) badge the event as "in planner",
(2) jump from the header to the exact session in the week grid, and (3) reconcile
the session's date when the user drags the event to another day in Google
Calendar.

## Goals

- Push: creating/toggling/deleting a planner session auto-creates/updates/deletes
  the matching all-day event on the user's primary Google Calendar (no manual
  sync button).
- Link: each pushed event embeds `[IELTS-PLANNER:<session-uuid>]` in its
  description; the planner stores the returned `gcal_event_id` on the session.
- Read-back: the "What are you doing today?" header badges events that belong to
  the planner and lets the user click through to that session in the week grid.
- Two-way date sync: if the user moves the event to another day in Google
  Calendar, the session's `date` updates to match on the next planner load.
- Backfill: a button syncs pre-existing sessions (no `gcal_event_id`) to the
  calendar, including sessions created while disconnected.
- Best-effort Google writes: local mutations never fail because Google did.

## Non-goals

- No editing of a session in the planner UI (no edit form exists today); the
  update path exists and is exercised by toggle-complete, and will be reused by a
  future edit form.
- No real start times. Events are all-day only (`duration_min` is not reflected).
- No per-event colors, reminders, or attendees.
- No multi-calendar support; always the primary calendar.
- No deletion of external (non-marker) events.

## Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Link storage | Marker in description **and** `gcal_event_id` column on `study_plan_items` |
| Sync trigger | Auto-sync on add / toggle / delete |
| Event timing | All-day event (date only, no time) |
| Read-back | Badge "In planner" + click-to-jump + two-way date reconciliation |
| Old import | "Sync into planner" button and `syncTodayEvents` action removed |
| Backfill | "Sync all to calendar" button added |

## Schema (schema-3.0.sql)

```sql
ALTER TABLE public.study_plan_items
  ADD COLUMN IF NOT EXISTS gcal_event_id text;
```

`gcal_event_id` is nullable; `NULL` means "not pushed to the calendar yet".
One event per session (the event id is created by Google and stored as-is). No
unique constraint (a session owns at most one event by construction).

`user_google_tokens.scope` (already exists) is now written at connect time so the
app can detect stale read-only connections.

## Marker format

Event description is two lines:

```
<summary>
[IELTS-PLANNER:<session-uuid>]
```

Parse back with `/\n?\[IELTS-PLANNER:([0-9a-f-]{36})\]/`.

Event summary (title): `MODULE_LABELS[module]` + (` · <topic>` when topic
present); fallback to the topic or `"IELTS session"` for null-module items. When
a session is completed, the title gains a `✓ ` prefix; un-toggling removes it.

## Google Calendar layer (`src/lib/gcal.ts`)

- Scope changes to `https://www.googleapis.com/auth/calendar.events`
  (read + write; supersedes `calendar.readonly`). Existing tokens are read-only
  and must re-connect once.
- Refactor token handling out of `getTodayEvents` into a shared
  `getAccessToken()` → `{ accessToken } | null`: loads the user's
  `user_google_tokens` row, refreshes when near expiry, persists the refresh.
  Returns `null` when disconnected or the refresh fails.
- `saveGoogleTokens` also writes `scope` so the UI can detect tokens that predate
  the write scope.
- Event helpers (all take `{ clientId, clientSecret, accessToken }` plus args):
  - `createCalendarEvent({ summary, date, sessionId })` → `POST
    /calendars/primary/events` with an all-day payload
    `{ summary, description, start: { date }, end: { date: date + 1 day } }` and
    returns the created event `id`.
  - `updateCalendarEvent({ eventId, summary })` → `PATCH .../events/{id}` (title
    change only; date/description untouched).
  - `deleteCalendarEvent({ eventId })` → `DELETE .../events/{id}`.
  - `listCalendarEvents(timeMin, timeMax)` → parses items into
    `{ summary, date (ISO day), sessionId: string | null }` via the marker regex.
- `TodayEvent` becomes `{ summary, start (display), date (ISO), sessionId }`;
  `GcalState` connected branch gains `scopeOk: boolean` (true when the stored
  scope includes `calendar.events`) and `sessionId` per event.
- `getTodayEvents()` now wraps `listCalendarEvents` for the local today range
  (kept for the header).

## Server actions (`src/app/(app)/planner/actions.ts`)

All Google writes are best-effort: wrap in try/catch, `console.error`, surface a
toast, never throw after the local mutation succeeded.

- `addPlanItem`: insert the row, then if connected create the event and set
  `gcal_event_id` on the returned row (return the updated row so the client has
  the id). Google failure → keep the row with `gcal_event_id = null`.
- `togglePlanItem`: after toggling, if `gcal_event_id` exists, update the event
  title (add/remove `✓ `).
- `deletePlanItem`: if `gcal_event_id` exists, delete the event first, then the
  row (best-effort: row delete still proceeds on Google failure).
- `disconnectGoogleCalendar`: unchanged (deletes the token row).
- **Removed** `syncTodayEvents()` (the old import action).
- `syncAllSessionsToCalendar(): Promise<{ synced: number }>`: for every
  `study_plan_items` row of the user with `gcal_event_id IS NULL`, create an
  event and store the id. Used by the backfill button.
- `reconcileCalendarDates(weekStart): Promise<void>`: `listCalendarEvents` over
  the visible week; for each event with a `sessionId`, compare the event's date
  to the session's `date` and update the session when they differ. The calendar
  is the source of truth for date (the planner has no move-UI today, so no
  conflict). Runs on the planner page load before the week is fetched.

## Planner page (`src/app/(app)/planner/page.tsx`)

- Reads `searchParams: Promise<{ gcal?, highlight?, date? }>`.
- On load, in order: `reconcileCalendarDates(weekStart)` → `Promise.all([
  getWeekPlan(weekStart), getTodayEvents() ])` so moved sessions appear on the
  correct day in the same render.
- Passes `initialHighlight` (session id) and the pre-computed `initialWeekStart`
  to `<WeeklyGrid>`.

## UI (`src/components/planner/gcal-header.tsx`, `weekly-grid.tsx`)

- Connected state:
  - Remove the "Sync into planner" button.
  - Keep [Disconnect].
  - Events strip: an event with `sessionId` renders with an "In planner" badge and
    a jump affordance; clicking navigates to
    `/planner?highlight=<sessionId>&date=<event date>`. External events render as
    today (no badge, not clickable).
  - Add "Sync all to calendar" (backfill) button; toast the synced count.
  - When `scopeOk === false`, show a banner: "Re-connect to enable syncing
    sessions to your calendar" with a Connect link (re-runs OAuth with the new
    scope).
- `WeeklyGrid`: accepts `initialHighlight`. On mount, if set, scroll the matching
  session card into view and briefly ring it (a few seconds), then clear local
  highlight state. The grid already always renders even when the week is empty
  (change from the previous session), so the jump works for any day.
- Toast notice handling: keep `gcal=connected` / `disconnected`; the import
  related `gcal` notices are unchanged in spirit.

## Error handling

- Google failures on writes: local state is authoritative, event simply not
  updated; toast communicates the failure; the next matching action retries
  (delete retries its own delete, toggle retries the title update, add leaves the
  row for backfill).
- Google failures on read (reconcile, header): planner still renders with local
  data; header falls back to the `error` state as today.
- Refresh-token revoked: treated as disconnected (existing behavior); user
  re-connects.

## Migration / setup notes

- Apply `schema-3.0.sql` to the local Supabase DB.
- Existing connected users (read-only scope) re-connect once to grant
  `calendar.events`; the stale-scope banner drives this.
- `docs/gcal-setup.md` updated: scope, all-day events, marker, re-connect note.

## Follow-ups (out of scope)

- Session edit UI (reuses the update path).
- A `start_time` column if timed events are wanted later.
- Batch/queue for Google writes if rate limits become an issue.
