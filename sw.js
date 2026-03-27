const CACHE_NAME = "media-player-v1";
const ASSETS = ["index.html", "./"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Don't cache the .enc blob — it goes into IndexedDB instead
  if (url.pathname.endsWith(".enc")) return;

  e.respondWith(
    caches
      .match(e.request)
      .then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((response) => {
          // Cache successful same-origin responses
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(e.request, clone));
          }
          return response;
        });
      })
      .catch(() => caches.match("index.html")),
  );
});
