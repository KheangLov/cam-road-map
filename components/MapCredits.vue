<script setup lang="ts">
type AppLang = 'en' | 'km'

const props = defineProps<{
  lang: AppLang
}>()

// The pipeline writes /data/meta.json with the build timestamp.
const { data: meta } = await useFetch<{ updatedAt?: string }>('/data/meta.json', {
  default: () => ({}),
})
const updated = computed(() => {
  const raw = meta.value?.updatedAt
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? raw : d.toISOString().slice(0, 10)
})
const text = computed(() => props.lang === 'km'
  ? {
      data: 'ទិន្នន័យ',
      roads: 'ផ្លូវ',
      boundaries: 'ព្រំដែន',
    }
  : {
      data: 'Data',
      roads: 'Roads',
      boundaries: 'Boundaries',
    })
</script>

<template>
  <footer class="credits">
    <span v-if="updated" class="credits__updated">{{ text.data }}: {{ updated }}</span>
    <span class="credits__attr">
      {{ text.roads }} © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> (ODbL)
      · {{ text.boundaries }}:
      <a href="https://data.humdata.org/" target="_blank" rel="noopener">HDX / NCDD</a>
    </span>
  </footer>
</template>

<style lang="scss" scoped>
.credits {
  position: absolute;
  bottom: 0;
  left: 0;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.25rem 0.6rem;
  background: $color-surface-translucent;
  border-top-right-radius: 6px;
  font-size: 0.7rem;
  color: $color-text-muted;
  z-index: 8;

  a {
    color: $color-accent;
    text-decoration: none;
  }

  &__updated {
    font-weight: 600;
  }
}

@media (max-width: 600px) {
  .credits__updated { display: none; }

  // Unconstrained width would let the attribution text run off the right
  // edge of a narrow screen instead of wrapping — it has to stay visible
  // (OSM/CARTO attribution is a license requirement, not just styling).
  .credits {
    right: 0;
  }

  .credits__attr {
    min-width: 0;
  }
}
</style>
