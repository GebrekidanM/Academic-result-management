import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

// 1. STANDARD PWA SETUP
self.skipWaiting()
clientsClaim()

// 2. PRECACHE BUILD ARTIFACTS

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// 3. CUSTOM API CACHING (Your logic adapted for Workbox)
const API_CACHE_NAME = 'freedom-api-cache-v1';

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore non-GET requests
  if (event.request.method !== 'GET') return;

  // Intercept API requests
  if (url.href.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If online and valid, clone and cache
          if (response && response.status === 200) {
            const resClone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(event.request, resClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline, return cached data
          return caches.match(event.request).then((cachedRes) => {
            if (cachedRes) return cachedRes;
            
            // Fallback JSON to prevent app crash
            return new Response(
              JSON.stringify({ error: "You are offline and this data is not cached." }), 
              { headers: { "Content-Type": "application/json" } }
            );
          });
        })
    );
  }
});