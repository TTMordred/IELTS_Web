import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Exclude Next.js internals and static assets that must never hit the
    // auth proxy: favicon, images, the PWA manifest, the service worker
    // script, and SEO files. The browser fetches these in contexts that may
    // not carry the session cookie — intercepting them redirects to /auth
    // (HTML), which breaks the manifest ("Syntax error") and blocks SW updates.
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.json$|manifest\\.webmanifest$|sw\\.js$|robots\\.txt$|sitemap\\.xml$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
