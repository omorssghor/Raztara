const CACHE_NAME = "raztara-v20261002-2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./app.html",
  "./profile.html",
  "./chat.html",
  "./manifest.json"
];

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_SHELL);
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  // Supabase/API কখনো cache হবে না
  if (
    request.url.includes("supabase.co") ||
    request.url.includes("/rest/") ||
    request.url.includes("/auth/")
  ) {
    return;
  }

  // HTML সবসময় network থেকে নেওয়ার চেষ্টা করবে
  if (
    request.mode === "navigate" ||
    request.destination === "document"
  ) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy);
          });

          return response;
        })
        .catch(() => caches.match(request))
    );

    return;
  }

  // অন্যান্য static file
  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request);
    })
  );
});
