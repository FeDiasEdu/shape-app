// ==========================
// VERSIONAMENTO
// ==========================
const APP_VERSION = "v1.8";
const CACHE_NAME = `fitness-app-${APP_VERSION}`;

// ==========================
// CACHE
// ==========================
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "https://cdn.jsdelivr.net/npm/chart.js"
];

// ==========================
// INSTALL
// ==========================
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// ==========================
// ACTIVATE
// ==========================
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  return self.clients.claim();
});

// ==========================
// FETCH (Network First)
// ==========================
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        const clone = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, clone));

        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(response => {
          return response || new Response("Offline", {
            status: 503,
            statusText: "Offline"
          });
        });
      })
  );
});

// ==========================
// SKIP WAITING
// ==========================
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
