// ==========================
// VERSIONAMENTO
// ==========================
const APP_VERSION = "v6";
const CACHE_NAME = `fitness-app-${APP_VERSION}`;

// ==========================
// ARQUIVOS PARA CACHE
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

  self.skipWaiting(); // 🔥 ativa imediatamente

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
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );

  return self.clients.claim(); // 🔥 assume controle imediato
});

// ==========================
// FETCH (NETWORK FIRST)
// ==========================
self.addEventListener("fetch", event => {

  event.respondWith(
    fetch(event.request)
      .then(response => {

        const responseClone = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, responseClone));

        return response;
      })
      .catch(() => caches.match(event.request))
  );

});
