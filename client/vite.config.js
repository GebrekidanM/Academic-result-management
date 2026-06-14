// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path';
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src', 
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
  ],
   resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});