import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';
import pkg from './package.json';

export default defineConfig(({ mode }) => {
  const single = mode === 'singlefile';
  return {
    base: './',
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
    plugins: [
      react(),
      single
        ? viteSingleFile()
        : VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg', 'apple-touch-icon.png'],
            manifest: {
              name: 'WordFlow', short_name: 'WordFlow', description: 'מילים באנגלית ובתאית, קצת בכל יום',
              lang: 'he', dir: 'rtl', start_url: './', scope: './', display: 'standalone', orientation: 'portrait',
              background_color: '#f5f4ef', theme_color: '#f5f4ef',
              icons: [
                { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
            },
            workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2,mp3}'], navigateFallback: 'index.html' },
          }),
    ],
    build: single ? { outDir: 'dist-preview', assetsInlineLimit: 100_000_000, cssCodeSplit: false } : { outDir: 'dist' },
    test: { environment: 'node' },
  };
});
