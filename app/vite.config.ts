import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png', 'open_book.png'],
      manifest: {
        name: 'Compagnon de Billy',
        short_name: 'Billy',
        description: 'Feuille de personnage, dés et combats pour les livres du Pyro-Barbare et de Billy.',
        lang: 'fr',
        start_url: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#17130f',
        theme_color: '#17130f',
        icons: [
          { src: 'icon.png', sizes: '480x480', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,woff2}'] },
    }),
  ],
})
