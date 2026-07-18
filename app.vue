<script setup lang="ts">
useSeoMeta({
  title: 'Cambodia Road Network Map',
  description:
    'Interactive map of Cambodia\'s road network with development status (built, under construction, proposed) and administrative boundaries — provinces, districts, communes and villages.',
})

// Reactive so the UI chrome (panels, credits bar) repaints instantly when
// the theme toggle changes it — see assets/scss/main.scss for the palettes.
const state = useMapState()
useHead({
  htmlAttrs: { 'data-theme': computed(() => state.theme.value) },
})
</script>

<template>
  <NuxtPage />
</template>
