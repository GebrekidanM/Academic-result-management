// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src', // <--- CHANGED FROM 'public'
      filename: 'service-worker.js',
      injectRegister: null, 
      registerType: 'autoUpdate',
      manifest: {
        name: 'Freedom SMS',
        short_name: 'Freedom',
        description: 'School management system',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0A0A0A',
        icons: [
          { src: '/er-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/er-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
});