import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeCodeForTokens,
  GCAL_SCOPE,
  getOAuthSettings,
  saveGoogleTokens,
} from "@/lib/gcal";
import { reconcileAllCalendarEvents } from "@/app/(app)/planner/actions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("gcal_oauth_state")?.value;
  const verifier = cookieStore.get("gcal_pkce_verifier")?.value;

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/planner?gcal=${reason}`);

  // User cancelled / Google returned an error.
  if (errorParam) return fail("error");

  // Guard: require the flow to have been started here (state + verifier cookies).
  if (!expectedState || !verifier || state !== expectedState) {
    return fail("error");
  }

  if (!code) return fail("error");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const settings = await getOAuthSettings();
  if (!settings) return fail("no-settings");

  const redirectUri = `${origin}/auth/google-calendar/callback`;

  try {
    const tokens = await exchangeCodeForTokens({
      clientId: settings.clientId,
      clientSecret: settings.clientSecret,
      redirectUri,
      code,
      codeVerifier: verifier,
    });
    const refreshToken = tokens.refresh_token;
    if (!refreshToken) {
      // Missing refresh_token means the offline scope was not granted.
      return fail("error");
    }
    await saveGoogleTokens(user.id, {
      refresh_token: refreshToken,
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
      scope: GCAL_SCOPE,
    });
  } catch (err) {
    console.error("gcal oauth callback error:", err);
    return fail("error");
  }

  // Scan the user's calendar (best-effort, must never block the redirect):
  // pull marker events into the planner and apply deletions both ways.
  try {
    await reconcileAllCalendarEvents();
  } catch (err) {
    console.error("gcal connect scan:", err);
  }

  // Clear one-time PKCE cookies.
  cookieStore.delete("gcal_pkce_verifier");
  cookieStore.delete("gcal_oauth_state");

  return NextResponse.redirect(`${origin}/planner?gcal=connected`);
}
