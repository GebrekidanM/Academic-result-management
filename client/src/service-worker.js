import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// 1. Force new Service Worker to take control immediately
self.skipWaiting();
clientsClaim();

// 2. Clear old Precache data (HTML/JS/CSS from previous builds)
cleanupOutdatedCaches();

// 3. Cache the new Build Artifacts
precacheAndRoute(self.__WB_MANIFEST);

// 4. API Caching (Updated to v5 to force fresh data)
registerRoute(
  ({ url }) => url.href.includes('/api/'),
  new NetworkFirst({
    cacheName: 'freedom-api-cache-v5', // <--- CHANGED TO v5
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
      }),
    ],
  })
);

// 5. Image Caching (Updated to v5)
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'freedom-images-v5', // <--- CHANGED TO v5
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// --- PUSH NOTIFICATIONS (Keep as is) ---
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

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});