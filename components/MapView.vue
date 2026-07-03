<script setup lang="ts">
import type { MapGeoJSONFeature } from 'maplibre-gl'
import type { RoadProperties, AdminProperties } from '~/types'

const mapEl = ref<HTMLElement | null>(null)
const roadMap = useRoadMap()
const state = useMapState()

onMounted(async () => {
  if (!mapEl.value) return
  await roadMap.createMap(mapEl.value)
  state.mapReady.value = true

  // Apply current UI state to the freshly-built map.
  roadMap.setStatusVisibility(state.visibleStatuses.value)
  for (const level of state.allAdminLevels) {
    roadMap.setAdminVisibility(level, state.isAdminVisible(level))
  }
  roadMap.setLabelLang(state.labelLang.value)

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

// Expose imperative camera moves + search to siblings via provide.
provide('flyToBounds', roadMap.flyToBounds)
provide('fitToCambodia', roadMap.fitToCambodia)
provide('searchFeatures', roadMap.search)

function toSelected(f: MapGeoJSONFeature) {
  const p = f.properties as Record<string, unknown>
  if (p && 'status' in p) {
    return { kind: 'road' as const, road: p as unknown as RoadProperties }
  }
  return { kind: 'admin' as const, admin: p as unknown as AdminProperties }
}
</script>

<template>
  <div class="map-view">
    <div ref="mapEl" class="map-view__canvas" />
    <div v-if="!state.mapReady.value" class="map-view__loading">
      <span class="map-view__spinner" />
      Loading Cambodia map…
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

  &__spinner {
    width: 28px;
    height: 28px;
    border: 3px solid rgba($color-accent, 0.25);
    border-top-color: $color-accent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
