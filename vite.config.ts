// ============================================================
// InstaRatiba — vite.config.ts (Segment 10: Final PWA config)
// Replaces the stub from Segment 2 with production-grade setup
// ============================================================

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      // ── Registration strategy ──────────────────────────────
      // 'autoUpdate' silently updates SW in the background and
      // reloads on next navigation — ideal for a school app where
      // admins don't want to think about updates.
      registerType: 'autoUpdate',

      // ── Dev mode ──────────────────────────────────────────
      devOptions: {
        enabled: true,              // test SW locally during `vite dev`
        type: 'module',
      },

      // ── Assets to precache ────────────────────────────────
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'apple-touch-icon.png',
        'masked-icon.svg',
        'robots.txt',
        'icons/*.png',
        'screenshots/*.png',
      ],

      // ── Web App Manifest ──────────────────────────────────
      manifest: {
        name: 'InstaRatiba — School Timetable Generator',
        short_name: 'InstaRatiba',
        description:
          'Automated CBC-compliant school timetable generator for Kenyan comprehensive schools. By AG Computer Solutions.',
        theme_color: '#2E7D32',
        background_color: '#F5F5F5',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'browser'],
        start_url: '/?source=pwa',
        scope: '/',
        orientation: 'any',
        lang: 'en-KE',
        categories: ['education', 'productivity', 'utilities'],
        dir: 'ltr',

        icons: [
          {
            src: 'icons/pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],

        // ── Shortcuts (long-press icon on Android) ──────────
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'View your timetable dashboard',
            url: '/dashboard?source=shortcut',
            icons: [{ src: 'icons/shortcut-dashboard.png', sizes: '96x96' }],
          },
          {
            name: 'Generate Timetable',
            short_name: 'Generate',
            description: 'Start timetable generation',
            url: '/review?source=shortcut',
            icons: [{ src: 'icons/shortcut-generate.png', sizes: '96x96' }],
          },
          {
            name: 'Teachers',
            short_name: 'Teachers',
            description: 'Manage teaching staff',
            url: '/teachers?source=shortcut',
            icons: [{ src: 'icons/shortcut-teachers.png', sizes: '96x96' }],
          },
        ],

        // ── Screenshots for install dialog ──────────────────
        screenshots: [
          {
            src: 'screenshots/desktop-dashboard.png',
            sizes: '1280x800',
            type: 'image/png',
            form_factor: 'wide',
            label: 'InstaRatiba Dashboard',
          },
          {
            src: 'screenshots/mobile-timetable.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Class Timetable View',
          },
        ],

        // ── Related apps ────────────────────────────────────
        prefer_related_applications: false,
      },

      // ── Workbox configuration ─────────────────────────────
      workbox: {
        // Precache everything built by Vite
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf}'],

        // Don't precache source maps in production
        globIgnores: ['**/*.map'],

        // ── Runtime caching strategies ──────────────────────
        runtimeCaching: [
          // Google Fonts stylesheets — StaleWhileRevalidate so
          // the cached version loads instantly while updating
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 4,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          // Google Fonts files — CacheFirst (fonts don't change)
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: { statuses: [0, 200] },
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          // Bootstrap Icons CDN — CacheFirst
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-assets',
              cacheableResponse: { statuses: [0, 200] },
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Supabase REST API — NetworkFirst so fresh data is
          // preferred but cached data is available offline
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          // Supabase Storage (school logos, assets) — CacheFirst
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              cacheableResponse: { statuses: [0, 200] },
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          // Lottie animation JSON files — CacheFirst
          {
            urlPattern: /\.json$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'lottie-animations',
              cacheableResponse: { statuses: [0, 200] },
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 90,
              },
            },
          },
          // App images (PNG/SVG) — StaleWhileRevalidate
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'app-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],

        // ── Offline fallback ─────────────────────────────────
        // When a navigation request fails and nothing is cached,
        // serve the shell SPA so React Router takes over.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api\//,                  // never cache API routes
          /\/timetable\/share\/.*/,    // share links should network-fail gracefully
        ],

        // ── Background sync tag ─────────────────────────────
        // Used by usePwaSync.ts to register offline mutations
        // for replay when connectivity returns.
        // (workbox-background-sync is imported in the custom SW)
      },

      // ── Custom Service Worker additions ───────────────────
      // Inject our background-sync + push notification logic
      // into the generated service worker.
      injectManifest: undefined, // keep using generateSW mode
    }),
  ],

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },

  build: {
    // ── Code splitting ───────────────────────────────────────
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'react-vendor':    ['react', 'react-dom', 'react-router-dom'],
          // UI / Animation
          'ui-vendor':       ['framer-motion', 'sonner'],
          // Data layer
          'data-vendor':     ['@supabase/supabase-js', '@tanstack/react-query', 'zustand'],
          // Forms + validation
          'form-vendor':     ['react-hook-form', 'zod', 'date-fns'],
          // Export (heavy — loaded lazily)
          'export-vendor':   ['jspdf', 'html2canvas', 'xlsx'],
        },
      },
    },
    // Raise the chunk-size warning threshold a little (export libs are large)
    chunkSizeWarningLimit: 700,
    // Generate source maps for Sentry / error tracking in production
    sourcemap: false, // set to 'hidden' if you add Sentry
  },

  // ── Dev server ─────────────────────────────────────────────
  server: {
    port: 3000,
    open: true,
    host: true, // expose on LAN so mobile devices can test
  },

  // ── Preview server (simulates Vercel locally) ──────────────
  preview: {
    port: 4173,
    host: true,
  },
})
