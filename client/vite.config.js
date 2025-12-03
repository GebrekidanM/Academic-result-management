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
      manifest: {
        
        name: 'Freedom SMS',
        short_name: 'Freedom',
        description: 'School management system',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0A0A0A',
        icons: [
          { src: '/er-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/er-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
  skipWaiting: true,
  clientsClaim: true,

  globPatterns: ['**/*.{js,css,png,svg,ico,json}'],

  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: { cacheName: 'google-fonts' }
    },
    {
      urlPattern: /.*\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'assets-cache' }
    },
    {
      urlPattern: /\/api\/.*$/,
      handler: 'NetworkFirst',
      options: { cacheName: 'api-cache' }
    },
    {
      urlPattern: /.*\.(?:png|jpg|jpeg|svg|gif|ico)$/i,
      handler: 'CacheFirst',
      options: { cacheName: 'images-cache' }
    }
  ]
}

    })
  ]
});
