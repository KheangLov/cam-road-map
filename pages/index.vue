<script setup lang="ts">
// The map shell touches `window`; render it client-side only.
type AppLang = 'en' | 'km'

const appLang = ref<AppLang>('en')
const fallbackTitle = computed(() => appLang.value === 'km' ? 'ផែនទីបណ្តាញផ្លូវកម្ពុជា' : 'Cambodia Road Network Map')
</script>

<template>
  <main class="app">
    <ClientOnly>
      <MapView />
      <SearchBox :lang="appLang" />
      <LayerPanel v-model="appLang" />
      <FeatureInfo :lang="appLang" />
      <template #fallback>
        <div class="app__ssr">{{ fallbackTitle }}</div>
      </template>
    </ClientOnly>
    <MapCredits :lang="appLang" />
  </main>
</template>

<style lang="scss" scoped>
.app {
  position: fixed;
  inset: 0;
  overflow: hidden;

  &__ssr {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: $color-text-muted;
  }
}
</style>
