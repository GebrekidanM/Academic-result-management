import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// 1. STANDARD SETUP
self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

// 2. PRECACHE BUILD ARTIFACTS (CRITICAL FIX)
// This line allows Vite to inject index.html, main.js, css, and icons automatically.
// This fixes the "Unable to find a place to inject the manifest" error.
precacheAndRoute(self.__WB_MANIFEST);

// 3. API CACHING (Network First -> Cache Fallback)
// We use Workbox 'registerRoute' instead of writing a raw 'fetch' listener.
// It does the same thing as your old code but is safer and cleaner.
registerRoute(
  ({ url }) => url.href.includes('/api/'),
  new NetworkFirst({
    cacheName: 'freedom-api-cache-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
      }),
    ],
  })
);

// 4. EXTERNAL ASSETS (Fonts, etc.)
// Optional: Caches Google Fonts or external images if you use them
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// 5. PUSH NOTIFICATIONS (Kept exactly as you wrote them)
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const title = data.title || "Freedom SMS";
  const options = {
    body: data.body || "New notification received.",
    icon: "/er-192.png",
    badge: "/er-192.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 6. NOTIFICATION CLICK
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Focus existing tab if open
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});