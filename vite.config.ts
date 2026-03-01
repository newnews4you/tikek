import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    build: {
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'data-bible-rkk': [path.resolve(__dirname, './data/library/Biblija_RKK1998.ts')],
            'data-bible-kjv': [path.resolve(__dirname, './data/library/Biblija-LT-KJV-2012.ts')],
            'data-katekizmas': [path.resolve(__dirname, './data/library/Katekizmas.ts')],
            'vendor': ['react', 'react-dom', 'lucide-react'],
          }
        }
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Tikėjimo Šviesa',
          short_name: 'Tikėjimo Šviesa',
          description: 'Katalikiškas žinių asistentas',
          theme_color: '#7f1d1d',
          background_color: '#fdfcf8',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // 15MB
        }
      }),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html;
        }
      }
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
