<script setup lang="ts">
import type { MapGeoJSONFeature } from 'maplibre-gl'
import type { RoadProperties, AdminProperties } from '~/types'

const mapEl = ref<HTMLElement | null>(null)
const roadMap = useRoadMap()
const state = useMapState()

// Re-applied after both initial map creation and a theme swap: `setTheme`
// rebuilds the pmtiles source/layers from scratch (see its doc comment), so
// visibility/label state doesn't survive a theme change on its own.
function applyUiState() {
  roadMap.setStatusVisibility(state.visibleStatuses.value)
  for (const level of state.allAdminLevels) {
    roadMap.setAdminVisibility(level, state.isAdminVisible(level))
  }
  roadMap.setLabelLang(state.labelLang.value)
}

onMounted(async () => {
  if (!mapEl.value) return
  await roadMap.createMap(mapEl.value, state.theme.value)
  state.mapReady.value = true
  applyUiState()

  roadMap.onClickFeature((f: MapGeoJSONFeature) => {
    state.selected.value = toSelected(f)
  })
})

onBeforeUnmount(() => roadMap.destroy())

// Keep the map in sync with reactive UI state.
watch(state.visibleStatuses, (v) => roadMap.setStatusVisibility(v), { deep: false })
watch(state.visibleAdmin, (v) => {
  for (const level of state.allAdminLevels) roadMap.setAdminVisibility(level, v.has(level))
}, { deep: false })
watch(state.labelLang, (l) => roadMap.setLabelLang(l))
watch(state.theme, async (t) => {
  if (!state.mapReady.value) return
  await roadMap.setTheme(t)
  applyUiState()
})

function toSelected(f: MapGeoJSONFeature) {
  const p = f.properties as Record<string, unknown>
  if (p && 'status' in p) {
    return { kind: 'road' as const, road: p as unknown as RoadProperties }
  }
  return { kind: 'admin' as const, admin: p as unknown as AdminProperties }
}

const loadingText = computed(() =>
  state.labelLang.value === 'km' ? 'កំពុងផ្ទុកផែនទីកម្ពុជា…' : 'Loading Cambodia map…',
)
</script>

<template>
  <div class="map-view">
    <div ref="mapEl" class="map-view__canvas" />
    <div v-if="!state.mapReady.value" class="map-view__loading">
      <AppLogo :size="88" />
      {{ loadingText }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.map-view {
  position: absolute;
  inset: 0;

  &__canvas {
    position: absolute;
    inset: 0;
  }

  &__loading {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    background: $color-bg;
    color: $color-text-muted;
    font-size: 0.95rem;
    z-index: 5;
  }
}
</style>
