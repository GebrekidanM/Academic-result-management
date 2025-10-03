import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true // allows testing PWA in dev mode
      },
      manifest: {
        name: "Freedom School Management System",
        short_name: "Freedom",
        description: "A modern, installable school management system for Freedom KG & Primary School.",
        theme_color: "#0A0A0A",
        background_color: "#ffffff",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone"],
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        id: "/",
        prefer_related_applications: false,
        categories: ["education", "productivity"],
        icons: [
          {
            src: "/er-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/er-512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/er-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable any"
          }
        ],
        screenshots: [
          {
            src: "/desktop.PNG",
            sizes: "720x540",
            type: "image/png",
            form_factor: "wide"
          },
          {
            src: "/mobile.PNG",
            sizes: "360x640",
            type: "image/png"
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,json}'],
        runtimeCaching: [
          // 1️⃣ Google Fonts (CacheFirst for offline font display)
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },

          // 2️⃣ Navigation / HTML (NetworkFirst with offline fallback)
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              networkTimeoutSeconds: 3,
              fallbackURL: '/offline.html' // display offline page if network fails
            }
          },

          // 3️⃣ JS and CSS (StaleWhileRevalidate)
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' || request.destination === 'style',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'assets-cache' }
          },

          // 4️⃣ API Requests (NetworkFirst to allow cached data offline)
          {
            urlPattern: /\/api\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 20 } 
            }
          },

          // 5️⃣ Images (CacheFirst for student photos, icons, etc.)
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 } // 30 days
            }
          }
        ]
      }

    })
  ]
})
