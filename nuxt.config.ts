import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-06-30',
  devtools: { enabled: true },

  // Disabled: serves the WSL Linux root path to Chrome DevTools' workspace
  // auto-mount feature, which Chrome (running on Windows) rejects with
  // "Unable to add filesystem: <illegal path>".
  experimental: { chromeDevtoolsProjectSettings: false },

  modules: ['@nuxt/eslint'],

  css: ['~/assets/scss/main.scss'],

  // MapLibre touches `window`; the map shell renders client-side only.
  // The rest of the app is SSR for fast first paint + SEO.
  ssr: true,

  app: {
    head: {
      htmlAttrs: { lang: 'km' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      // Path to the single PMTiles archive produced by the data pipeline.
      // Served via a server route (not a static public asset): PMTiles needs
      // real HTTP byte-range responses, which neither Nitro's static-asset
      // handler nor Vercel's static hosting reliably provide.
      pmtilesUrl: process.env.NUXT_PUBLIC_PMTILES_URL || '/api/data/cambodia.pmtiles',
      // Free vector basemap styles (no API token required).
      basemapStyleUrl: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      basemapStyleUrlDark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      // Stamped at build time by the pipeline.
      dataUpdatedAt: process.env.DATA_UPDATED_AT || '',
    },
  },

  nitro: {
    // Bundles the pmtiles file into the server output itself (rather than reading
    // it from `public/` at request time), so it's readable from the route handler
    // on Vercel too, where `public/` is deployed to the CDN, not the function's
    // filesystem.
    serverAssets: [{
      baseName: 'pmtiles',
      dir: fileURLToPath(new URL('./public/data', import.meta.url)),
      pattern: 'cambodia.pmtiles',
    }],
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/_variables.scss" as *;',
        },
      },
    },
  },
})
