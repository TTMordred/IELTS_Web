import { createHash, randomBytes } from "node:crypto";
import { MODULE_LABELS, type ModuleKey } from "@/lib/planner/modules";
import { addDays } from "@/lib/planner/date";
import { createClient } from "@/lib/supabase/server";

export type TodayEvent = {
  summary: string;
  start: string | null;
  date: string;
  sessionId: string | null;
};

type GcalApiItem = {
  id?: string | null;
  status?: string | null;
  summary?: string | null;
  description?: string | null;
  start?: { dateTime?: string | null; date?: string | null } | null;
};

export type GcalState =
  | { connected: true; events: TodayEvent[]; scopeOk: boolean }
  | {
      connected: false;
      reason: "no-settings" | "not-connected" | "error";
      events: [];
    };

export const GCAL_SCOPE = "https://www.googleapis.com/auth/calendar.events";
export const GCAL_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GCAL_TOKEN_URL = "https://oauth2.googleapis.com/token";

const CAL_EVENTS_URL =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

const MARKER_RE = /\n?\[IELTS-PLANNER:([0-9a-f-]{36})\]/;

/** Pull the `[IELTS-PLANNER:<uuid>]` marker out of an event description. */
export function parsePlannerMarker(
  description?: string | null
): string | null {
  if (!description) return null;
  const m = description.match(MARKER_RE);
  return m ? m[1] : null;
}

export function hasWriteScope(scope: string | null): boolean {
  return scope?.includes(GCAL_SCOPE) ?? false;
}

export function sessionEventTitle(
  module: ModuleKey | null,
  topic: string | null
): string {
  const label = module ? MODULE_LABELS[module] : null;
  if (label && topic) return `${label} · ${topic}`;
  if (label) return label;
  return topic ?? "IELTS session";
}

/** base64url encoding (RFC 4648 §5) without padding — Google PKCE needs this. */
function base64Url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function generateCodeVerifier(): string {
  return base64Url(randomBytes(48));
}

export function generateState(): string {
  return base64Url(randomBytes(24));
}

export function computeCodeChallenge(verifier: string): string {
  return base64Url(createHash("sha256").update(verifier).digest());
}

export type OAuthSettings = {
  clientId: string;
  clientSecret: string;
};

/** Read the Google OAuth credentials from the settings table (or null). */
export async function getOAuthSettings(): Promise<OAuthSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("google_oauth_settings")
    .select("client_id, client_secret")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data?.client_id || !data.client_secret) return null;
  return { clientId: data.client_id, clientSecret: data.client_secret };
}

export function buildGoogleAuthUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: GCAL_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state: opts.state,
    code_challenge: opts.codeChallenge,
    code_challenge_method: "S256",
  });
  return `${GCAL_AUTH_URL}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

/**
 * Exchange an authorization code for tokens.
 * Google requires client_secret even with PKCE for web-app clients.
 */
export async function exchangeCodeForTokens(opts: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    redirect_uri: opts.redirectUri,
    grant_type: "authorization_code",
    code: opts.code,
    code_verifier: opts.codeVerifier,
  });
  const res = await fetch(GCAL_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

/** Refresh an access token from a stored refresh token. */
export async function refreshAccessToken(opts: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<{ access_token: string; expires_in?: number }> {
  const body = new URLSearchParams({
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    grant_type: "refresh_token",
    refresh_token: opts.refreshToken,
  });
  const res = await fetch(GCAL_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  return { access_token: data.access_token, expires_in: data.expires_in };
}

/** Store (upsert) the user's Google tokens in the DB. */
export async function saveGoogleTokens(
  userId: string,
  tokens: {
    refresh_token: string;
    access_token?: string;
    expires_in?: number;
    scope?: string;
  }
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("user_google_tokens").upsert(
    {
      user_id: userId,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token ?? null,
      token_expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      scope: tokens.scope ?? null,
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

export type AccessToken = { accessToken: string; scope: string | null };

/** Return a valid access token for the current user, or null when unavailable. */
export async function getAccessToken(): Promise<AccessToken | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const settings = await getOAuthSettings();
  if (!settings) return null;

  const { data: tokens } = await supabase
    .from("user_google_tokens")
    .select("refresh_token, access_token, token_expires_at, scope")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!tokens?.refresh_token) return null;

  const stillValid =
    tokens.access_token &&
    tokens.token_expires_at &&
    new Date(tokens.token_expires_at).getTime() > Date.now() + 60_000;

  let accessToken = tokens.access_token ?? undefined;
  if (!stillValid) {
    try {
      const refreshed = await refreshAccessToken({
        clientId: settings.clientId,
        clientSecret: settings.clientSecret,
        refreshToken: tokens.refresh_token,
      });
      accessToken = refreshed.access_token;
      await saveGoogleTokens(user.id, {
        refresh_token: tokens.refresh_token,
        access_token: refreshed.access_token,
        expires_in: refreshed.expires_in,
        scope: tokens.scope ?? GCAL_SCOPE,
      });
    } catch {
      return null;
    }
  }
  if (!accessToken) return null;
  return { accessToken, scope: tokens.scope ?? null };
}

export async function createCalendarEvent(opts: {
  accessToken: string;
  summary: string;
  date: string;
  sessionId: string;
}): Promise<string> {
  const res = await fetch(CAL_EVENTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: opts.summary,
      description: `${opts.summary}\n[IELTS-PLANNER:${opts.sessionId}]`,
      start: { date: opts.date },
      end: { date: addDays(opts.date, 1) }, // all-day end date is exclusive
    }),
  });
  if (!res.ok) {
    throw new Error(`Google event create failed: ${res.status}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function updateCalendarEvent(opts: {
  accessToken: string;
  eventId: string;
  summary: string;
}): Promise<void> {
  const res = await fetch(`${CAL_EVENTS_URL}/${opts.eventId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ summary: opts.summary }),
  });
  if (!res.ok) throw new Error(`Google event update failed: ${res.status}`);
}

export async function deleteCalendarEvent(opts: {
  accessToken: string;
  eventId: string;
}): Promise<void> {
  const res = await fetch(`${CAL_EVENTS_URL}/${opts.eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${opts.accessToken}` },
  });
  // 404/410 mean the event is already gone — deleting it is a no-op success.
  if (res.ok || res.status === 404 || res.status === 410) return;
  throw new Error(`Google event delete failed: ${res.status}`);
}

/**
 * Probe whether a Google event still exists. Returns false on a 404 (deleted),
 * so the sync can distinguish a truly-deleted event from one merely moved
 * outside the queried range.
 */
export async function getCalendarEvent(opts: {
  accessToken: string;
  eventId: string;
}): Promise<boolean> {
  const res = await fetch(`${CAL_EVENTS_URL}/${opts.eventId}`, {
    headers: { Authorization: `Bearer ${opts.accessToken}` },
    cache: "no-store",
  });
  if (res.status === 404 || res.status === 410) return false;
  if (!res.ok) throw new Error(`Google event get failed: ${res.status}`);
  return true;
}

export type ParsedGcalEvent = {
  eventId: string;
  summary: string;
  date: string; // "YYYY-MM-DD" local day
  startTime: string | null; // "HH:MM" for timed events, null for all-day
  sessionId: string | null;
};

export async function listCalendarEvents(opts: {
  accessToken: string;
  timeMin: string;
  timeMax: string;
}): Promise<ParsedGcalEvent[]> {
  const url = new URL(CAL_EVENTS_URL);
  url.searchParams.set("timeMin", opts.timeMin);
  url.searchParams.set("timeMax", opts.timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "50");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${opts.accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google events list failed: ${res.status}`);
  const data = (await res.json()) as { items?: GcalApiItem[] };
  return (data.items ?? [])
    .filter((e) => e.status !== "cancelled")
    .map((e) => {
      const dateTime = e.start?.dateTime ?? null;
      return {
        eventId: e.id ?? "",
        summary: e.summary ?? "Untitled event",
        date: (e.start?.date ?? dateTime?.slice(0, 10)) ?? "",
        startTime: dateTime
          ? new Date(dateTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
        sessionId: parsePlannerMarker(e.description),
      };
    });
}

export async function getTodayEvents(): Promise<GcalState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { connected: false, reason: "not-connected", events: [] };

  const settings = await getOAuthSettings();
  if (!settings) return { connected: false, reason: "no-settings", events: [] };

  const token = await getAccessToken();
  if (!token) return { connected: false, reason: "not-connected", events: [] };

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  let parsed: ParsedGcalEvent[];
  try {
    parsed = await listCalendarEvents({
      accessToken: token.accessToken,
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
    });
  } catch (err) {
    console.error("gcal getTodayEvents:", err);
    return { connected: false, reason: "error", events: [] };
  }

  const events: TodayEvent[] = parsed.map((e) => ({
    summary: e.summary,
    start: e.startTime ?? (e.date ? "All day" : null),
    date: e.date,
    sessionId: e.sessionId,
  }));

  return { connected: true, events, scopeOk: hasWriteScope(token.scope) };
}
