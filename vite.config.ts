import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Soma AI',
          short_name: 'Soma AI',
          description: 'The ultimate AI learning companion',
          theme_color: '#4f46e5',
          icons: [
            {
              src: 'favicon.png', 
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'favicon.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          // Precache core learner shell without forcing heavy admin/enterprise/export bundles onto mobile data
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
          globIgnores: [
            '**/Admin*.js',
            '**/School*.js',
            '**/Teacher*.js',
            '**/Institution*.js',
            '**/Partner*.js',
            '**/Developer*.js',
            '**/Organization*.js',
            '**/Research*.js',
            '**/Creator*.js',
            '**/Publisher*.js',
            '**/jspdf*.js',
            '**/paperDocxExport*.js',
            '**/html2canvas*.js',
          ],
        }
      })
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['framer-motion', 'lucide-react'],
            supabase: ['@supabase/supabase-js']
          }
        }
      }
    }
  };
});
