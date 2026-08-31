// IELTS Hub — Service Worker
//
// Navigation requests are NETWORK-FIRST: the browser always fetches the latest
// app shell from the server, and the cached shell is only a fallback for when
// the network is unavailable. This prevents serving a stale HTML shell whose
// hashed /_next/ chunk references no longer exist after a dev-server restart
// or deploy — which previously broke client hydration and, in Turbopack dev,
// the CSS that is injected via JavaScript.
const CACHE_NAME = "ielts-hub-v3";
const APP_SHELL = [
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept RSC payloads, Next.js internals, or API routes —
  // let the browser handle these directly to avoid duplicate fetches.
  if (
    url.searchParams.has("_rsc") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/")
  ) return;

  if (event.request.mode === "navigate") {
    // Network-first for page navigations: always get the fresh shell,
    // cache it for offline, and fall back to the cached shell only when
    // the network request fails (offline).
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then(
            (cached) => cached ?? caches.match("/dashboard") ?? Response.error()
          )
        )
    );
    return;
  }

  // Static assets (manifest, icons, etc.): cache-first, then network.
  event.respondWith(
    caches.match(event.request).then(
      (cached) => cached ?? fetch(event.request)
    )
  );
});
