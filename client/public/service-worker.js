const CACHE_NAME = "freedom-cache-v3"; // Version bump to force update
const DYNAMIC_CACHE = "freedom-dynamic-v3";

const ASSETS_TO_CACHE = [
  "/", 
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/er-192.png",
  "/er-512.png"
];

// 1. INSTALL
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. ACTIVATE (Clean up old caches)
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  return self.clients.claim();
});

// 3. FETCH
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // A. Ignore POST/PUT/DELETE
  if (event.request.method !== "GET") return;

  // B. API REQUESTS (Network First -> Cache)
  // Use includes() to match production domains (https://freedomschool.pro.et/api/...)
  if (url.href.includes("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If response is valid, clone and cache it
          if (response && response.status === 200) {
            const resClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(event.request, resClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline, return cached data
          return caches.match(event.request).then(cachedRes => {
            if (cachedRes) return cachedRes;
            // Fallback JSON if not in cache
            return new Response(JSON.stringify({ error: "Offline" }), {
              headers: { "Content-Type": "application/json" }
            });
          });
        })
    );
    return;
  }

  // C. STATIC ASSETS & BUNDLES (Stale-While-Revalidate)
  // This caches your React JS chunks, CSS, and Images automatically
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // 1. Return cached file immediately if found
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // 2. Update cache in the background
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for navigation (e.g. /students) -> serve index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});