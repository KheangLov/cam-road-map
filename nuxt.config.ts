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
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      // Path to the single PMTiles archive produced by the data pipeline.
      pmtilesUrl: process.env.NUXT_PUBLIC_PMTILES_URL || '/api/data/cambodia.pmtiles',
      // Free vector basemap style (no API token required).
      basemapStyleUrl: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      // Stamped at build time by the pipeline.
      dataUpdatedAt: process.env.DATA_UPDATED_AT || '',
    },
  },

  routeRules: {
    '/api/data/**.pmtiles': {
      headers: {
        'accept-ranges': 'bytes',
        'content-type': 'application/vnd.pmtiles',
      },
    },
  },

  nitro: {
    // PMTiles uses HTTP byte-range requests; compressed public assets break range reads.
    compressPublicAssets: false,
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
