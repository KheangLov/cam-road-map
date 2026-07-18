<script setup lang="ts">
import { STATUS_COLOR, STATUS_LABEL, ADMIN_COLOR } from '~/utils/mapConfig'
import { ADMIN_LABEL } from '~/types'
import { ROAD_SURFACE_LEGEND, ROAD_SURFACE_LEGEND_HINT } from '~/composables/useRoadMap'

type AppLang = 'en' | 'km'

const props = defineProps<{
  modelValue: AppLang
}>()
const emit = defineEmits<{
  'update:modelValue': [value: AppLang]
}>()

const state = useMapState()
// Start collapsed on small screens so the panel doesn't cover the whole map
// (and the search bar underneath it) the moment the page loads; desktop
// keeps the previous always-open default.
const open = ref(true)
onMounted(() => {
  if (window.innerWidth < 640) open.value = false
})
const isEnglishLabel = computed(() => props.modelValue === 'en')
const isKhmerLabel = computed(() => props.modelValue === 'km')

const text = computed(() => props.modelValue === 'km'
  ? {
      layers: 'ស្រទាប់',
      roadSurface: 'ប្រភេទផ្ទៃផ្លូវ',
      roadSurfaceHint: 'ពណ៌ផ្លូវបង្ហាញប្រភេទផ្ទៃផ្លូវនៅពេលមានទិន្នន័យ។ បន្ទាត់ដាច់ៗបង្ហាញផ្លូវកំពុងសាងសង់ ឬផ្លូវដែលបានស្នើ។',
      roadStatus: 'ស្ថានភាពផ្លូវ',
      adminBoundaries: 'ព្រំដែនរដ្ឋបាល',
      labels: 'ភាសាស្លាក',
      theme: 'រូបរាង',
      light: 'ភ្លឺ',
      dark: 'ងងឹត',
    }
  : {
      layers: 'Layers',
      roadSurface: 'Road surface',
      roadSurfaceHint: ROAD_SURFACE_LEGEND_HINT,
      roadStatus: 'Road status',
      adminBoundaries: 'Administrative boundaries',
      labels: 'Labels',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
    })

const isLightTheme = computed(() => state.theme.value === 'light')
const isDarkTheme = computed(() => state.theme.value === 'dark')

const surfaceTextKm: Record<string, { label: string, description: string, hint: string }> = {
  asphalt: {
    label: 'កៅស៊ូ / ផ្លូវក្រាល',
    description: 'ផ្លូវក្រាលសម្រាប់ចរាចរណ៍ទូទៅ។',
    hint: 'ផ្លូវពណ៌ខៀវជាផ្លូវក្រាល ជាធម្មតា asphalt ឬផ្ទៃក្រាលស្រដៀងគ្នា។',
  },
  concrete: {
    label: 'បេតុង',
    description: 'ផ្លូវបេតុង ឬផ្លូវបេតុងជាខ្សែ។',
    hint: 'ផ្លូវពណ៌បៃតងខៀវត្រូវបានកំណត់ថាជាផ្ទៃបេតុង។',
  },
  unpaved: {
    label: 'មិនទាន់ក្រាល',
    description: 'ផ្លូវក្រួស ដី ឬដីបង្ហាប់។',
    hint: 'ផ្លូវពណ៌លឿងត្នោតអាចជាផ្ទៃក្រួស ដី ឬដីបង្ហាប់។',
  },
  unknown: {
    label: 'មិនមានទិន្នន័យផ្ទៃ',
    description: 'ផ្លូវដែលមិនទាន់មានទិន្នន័យប្រភេទផ្ទៃ។',
    hint: 'ផ្លូវពណ៌ប្រផេះស្រាលមិនមានព័ត៌មានផ្ទៃក្នុងទិន្នន័យផែនទីបច្ចុប្បន្ន។',
  },
}

const statusTextKm: Record<string, string> = {
  built: 'បានសាងសង់',
  under_construction: 'កំពុងសាងសង់',
  proposed: 'បានស្នើ',
}

const adminTextKm: Record<string, string> = {
  adm1: 'រាជធានី / ខេត្ត',
  adm2: 'ក្រុង / ស្រុក / ខណ្ឌ',
  adm3: 'ឃុំ / សង្កាត់',
  village: 'ភូមិ',
}

watch(() => props.modelValue, (lang) => state.setLabelLang(lang), { immediate: true })

function setLanguage(lang: AppLang) {
  emit('update:modelValue', lang)
  state.setLabelLang(lang)
}

function surfaceLabel(item: (typeof ROAD_SURFACE_LEGEND)[number]) {
  return props.modelValue === 'km' ? surfaceTextKm[item.key].label : item.label
}

function surfaceDescription(item: (typeof ROAD_SURFACE_LEGEND)[number]) {
  return props.modelValue === 'km' ? surfaceTextKm[item.key].description : item.description
}

function surfaceHint(item: (typeof ROAD_SURFACE_LEGEND)[number]) {
  return props.modelValue === 'km' ? surfaceTextKm[item.key].hint : item.hint
}

function statusLabel(status: keyof typeof STATUS_LABEL) {
  return props.modelValue === 'km' ? statusTextKm[String(status)] ?? STATUS_LABEL[status] : STATUS_LABEL[status]
}

function adminLabel(level: keyof typeof ADMIN_LABEL) {
  return props.modelValue === 'km' ? adminTextKm[String(level)] ?? ADMIN_LABEL[level] : ADMIN_LABEL[level]
}
</script>

<template>
  <section class="panel" :class="{ 'panel--collapsed': !open }">
    <header class="panel__head">
      <h2 class="panel__title">{{ text.layers }}</h2>
      <button type="button" class="panel__toggle" :aria-expanded="open" @click="open = !open">
        {{ open ? '–' : '+' }}
      </button>
    </header>

    <div v-show="open" class="panel__body">
      <fieldset class="panel__group">
        <legend>{{ text.roadSurface }}</legend>
        <p class="panel__hint">{{ text.roadSurfaceHint }}</p>
        <ul class="panel__legend">
          <li
            v-for="item in ROAD_SURFACE_LEGEND"
            :key="item.key"
            class="panel__legend-item"
            :title="surfaceHint(item)"
          >
            <span class="panel__swatch" :style="{ background: item.color }" />
            <span class="panel__legend-text">
              <span class="panel__legend-label">{{ surfaceLabel(item) }}</span>
              <span class="panel__legend-description">{{ surfaceDescription(item) }}</span>
            </span>
          </li>
        </ul>
      </fieldset>

      <fieldset class="panel__group">
        <legend>{{ text.roadStatus }}</legend>
        <label v-for="s in state.allStatuses" :key="s" class="panel__row">
          <input
            type="checkbox"
            :checked="state.isStatusVisible(s)"
            @change="state.toggleStatus(s)"
          >
          <span class="panel__swatch" :style="{ background: STATUS_COLOR[s] }" />
          {{ statusLabel(s) }}
        </label>
      </fieldset>

      <fieldset class="panel__group">
        <legend>{{ text.adminBoundaries }}</legend>
        <label v-for="l in state.allAdminLevels" :key="l" class="panel__row">
          <input
            type="checkbox"
            :checked="state.isAdminVisible(l)"
            @change="state.toggleAdmin(l)"
          >
          <span class="panel__swatch panel__swatch--line" :style="{ background: ADMIN_COLOR[l] }" />
          {{ adminLabel(l) }}
        </label>
      </fieldset>

      <fieldset class="panel__group">
        <legend>{{ text.labels }}</legend>
        <div class="panel__seg">
          <button
            type="button"
            :class="{ 'is-active': isEnglishLabel }"
            :aria-pressed="isEnglishLabel"
            @click="setLanguage('en')"
          >EN</button>
          <button
            type="button"
            :class="{ 'is-active': isKhmerLabel }"
            :aria-pressed="isKhmerLabel"
            @click="setLanguage('km')"
          >ខ្មែរ</button>
        </div>
      </fieldset>

      <fieldset class="panel__group">
        <legend>{{ text.theme }}</legend>
        <div class="panel__seg">
          <button
            type="button"
            :class="{ 'is-active': isLightTheme }"
            :aria-pressed="isLightTheme"
            @click="state.setTheme('light')"
          >☀ {{ text.light }}</button>
          <button
            type="button"
            :class="{ 'is-active': isDarkTheme }"
            :aria-pressed="isDarkTheme"
            @click="state.setTheme('dark')"
          >☾ {{ text.dark }}</button>
        </div>
      </fieldset>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.panel {
  position: absolute;
  top: 1rem;
  left: 1rem;
  width: 240px;
  // 1rem top + 1rem bottom clearance so the panel can never grow past the
  // viewport (short windows, phone landscape, a lot of expanded layers…) —
  // the body scrolls internally instead once it hits this cap.
  max-height: calc(100dvh - 2rem);
  display: flex;
  flex-direction: column;
  background: $color-surface;
  border-radius: $radius;
  box-shadow: $shadow;
  z-index: 10;
  overflow: hidden;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.85rem;
    border-bottom: 1px solid $color-border;
    flex: none;
  }

  &__title {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0;
  }

  &__toggle {
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 6px;
    background: $color-bg;
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
  }

  &__body {
    padding: 0.5rem 0.85rem 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    overflow-y: auto;
    // Lets a flex child actually shrink and scroll instead of forcing the
    // panel taller than its `max-height` cap (flex items default to
    // min-height: auto, which ignores overflow).
    min-height: 0;
  }

  &__group {
    border: none;
    margin: 0;
    padding: 0;

    legend {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: $color-text-muted;
      margin-bottom: 0.4rem;
    }
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.18rem 0;
    font-size: 0.88rem;
    cursor: pointer;
  }

  &__hint {
    margin: 0 0 0.45rem;
    color: $color-text-muted;
    font-size: 0.78rem;
    line-height: 1.35;
  }

  &__legend {
    display: flex;
    flex-direction: column;
    gap: 0.38rem;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  &__legend-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }

  &__legend-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__legend-label {
    font-size: 0.86rem;
    line-height: 1.15;
  }

  &__legend-description {
    color: $color-text-muted;
    font-size: 0.74rem;
    line-height: 1.25;
  }

  &__swatch {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    flex: none;
    margin-top: 0.05rem;

    &--line {
      height: 4px;
      border-radius: 2px;
      margin-top: 0;
    }
  }

  &__seg {
    display: inline-flex;
    border: 1px solid $color-border;
    border-radius: 6px;
    overflow: hidden;

    button {
      border: none;
      background: $color-surface;
      padding: 0.3rem 0.7rem;
      cursor: pointer;
      font-size: 0.85rem;

      &.is-active {
        background: $color-accent;
        color: $color-bg;
      }
    }
  }
}

@media (max-width: 600px) {
  .panel {
    width: calc(100vw - 2rem);
    // The search bar sits centered at the same top:1rem, full-width on
    // mobile too — stack below it instead of covering it.
    top: 4rem;
    max-height: calc(100dvh - 5rem);
  }
}
</style>
