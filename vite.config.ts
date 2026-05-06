import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Rommelmarkt.app',
          short_name: 'Rommelmarkt',
          description: 'Scan items met AI en verkoop ze razendsnel op je lokale rommelmarkt.',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          start_url: '/app',
          display: 'standalone',
          orientation: 'portrait',
          dir: 'ltr',
          lang: 'nl',
          categories: ['shopping', 'business', 'lifestyle'],
          shortcuts: [
             {
               name: "Nieuwe Scan",
               short_name: "Scan",
               description: "Scan een nieuw item met de camera",
               url: "/app/scan",
               icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }]
             }
          ],
          icons: [
            {
               src: '/icon-192.png',
               sizes: '192x192',
               type: 'image/png',
               purpose: 'any'
            },
            {
               src: '/icon-192.png',
               sizes: '192x192',
               type: 'image/png',
               purpose: 'maskable'
            },
            {
               src: '/icon-512.png',
               sizes: '512x512',
               type: 'image/png',
               purpose: 'any'
            },
            {
               src: '/icon-512.png',
               sizes: '512x512',
               type: 'image/png',
               purpose: 'maskable'
            }
          ],
          screenshots: [
            {
              src: '/screenshot-wide.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Rommelmarkt Desktop View'
            },
            {
              src: '/screenshot-narrow.png',
              sizes: '720x1280',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Rommelmarkt Mobile View'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
