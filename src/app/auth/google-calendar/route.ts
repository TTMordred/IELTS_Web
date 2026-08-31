import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  buildGoogleAuthUrl,
  computeCodeChallenge,
  generateCodeVerifier,
  generateState,
  getOAuthSettings,
} from "@/lib/gcal";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const settings = await getOAuthSettings();
  if (!settings) {
    return NextResponse.redirect(
      new URL("/planner?gcal=no-settings", request.url)
    );
  }
  const { clientId } = settings;

  const { origin } = new URL(request.url);
  const redirectUri = `${origin}/auth/google-calendar/callback`;

  // PKCE: verifier lives in an httpOnly cookie, only the challenge goes to Google.
  const verifier = generateCodeVerifier();
  const state = generateState();

  const cookieStore = await cookies();
  cookieStore.set("gcal_pkce_verifier", verifier, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes to complete the flow
  });
  cookieStore.set("gcal_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const authUrl = buildGoogleAuthUrl({
    clientId,
    redirectUri,
    state,
    codeChallenge: computeCodeChallenge(verifier),
  });

  return NextResponse.redirect(authUrl);
}
