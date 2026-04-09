// IELTS Hub — Service Worker (cache-first for app shell only)
const CACHE_NAME = "ielts-hub-v2";
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

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Only cache successful navigation responses (app shell pages)
        if (response.ok && event.request.mode === "navigate") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match("/dashboard") ?? Response.error());
    })
  );
});
