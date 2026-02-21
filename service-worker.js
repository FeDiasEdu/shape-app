// ==========================
// VERSIONAMENTO
// ==========================
const APP_VERSION = "v2"; // 🔥 Sempre altere quando atualizar o app
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
  console.log("Service Worker instalado");

  self.skipWaiting(); // ativa imediatamente

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// ==========================
// ACTIVATE
// ==========================
self.addEventListener("activate", event => {
  console.log("Service Worker ativado");

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log("Removendo cache antigo:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );

  return self.clients.claim(); // assume controle imediato
});

// ==========================
// FETCH (CACHE FIRST)
// ==========================
self.addEventListener("fetch", event => {

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );

});
