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
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: { cacheName: 'html-cache' }
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' || request.destination === 'style',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'assets-cache' }
          }
        ]
      }
    })
  ]
})
