//servce-worker.js
const CACHE_NAME = "freedom-cache-v1";

// In React builds, assets live in /dist or /build
const ASSETS_TO_CACHE = [
  "/", 
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/er-192.png",
  "/er-512.png"
];

// Install
self.addEventListener("install", event => {
  console.log("SW installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", event => {
  console.log("SW activating...");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => (key !== CACHE_NAME ? caches.delete(key) : null)))
    )
  );
});

// Fetch
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request)
        .then(response => {
          // Cache new requests (like JS/CSS chunks)
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match("/index.html")); // fallback for React routes
    })
  );
});
