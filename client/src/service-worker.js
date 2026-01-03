const CACHE_NAME = "freedom-cache-v4"; 
const DYNAMIC_CACHE = "freedom-dynamic-v4";
const API_CACHE_NAME = 'freedom-api-cache-v1';

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

// 2. ACTIVATE
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE && key !== API_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  return self.clients.claim();
});

// 3. FETCH (Caching Strategies)
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;

  // A. API Requests (Network First -> Cache)
  if (url.href.includes("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const resClone = response.clone();
            caches.open(API_CACHE_NAME).then(cache => {
              cache.put(event.request, resClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then(cachedRes => {
            if (cachedRes) return cachedRes;
            return new Response(JSON.stringify({ error: "You are offline" }), {
              headers: { "Content-Type": "application/json" }
            });
          });
        })
    );
    return;
  }

  // B. Static Assets (Stale-While-Revalidate)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline Fallback for Navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
      return cachedResponse || fetchPromise;
    })
  );
});

// 4. PUSH LISTENER (Receives message from Server when browser is closed)
self.addEventListener('push', function(event) {
  let data = {};
  
  if (event.data) {
    data = event.data.json();
  }

  const title = data.title || "Freedom SMS";
  const options = {
    body: data.body || "New notification received.",
    icon: "/er-192.png", // Icon to show next to message
    badge: "/er-192.png", // Small white icon for Android status bar
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 5. NOTIFICATION CLICK (Opens the app)
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // If tab is already open, focus it
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});