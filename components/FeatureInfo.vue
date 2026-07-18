<script setup lang="ts">
import { STATUS_LABEL, ROAD_STATUSES } from '~/utils/mapConfig'
import { ADMIN_LABEL } from '~/types'
import type { RoadStatus } from '~/types'
import { ASPHALT_SURFACES, CONCRETE_SURFACES, UNPAVED_SURFACES } from '~/shared/surfaceCategory.mjs'
import { GithubApiError } from '~/composables/useGithubOverrides'

type AppLang = 'en' | 'km'

const props = defineProps<{
  lang: AppLang
}>()
const state = useMapState()
const gh = useGithubOverrides()
const sel = computed(() => state.selected.value)
const text = computed(() => props.lang === 'km'
  ? {
      road: 'ផ្លូវ',
      close: 'បិទ',
      name: 'ឈ្មោះ',
      roadNo: 'លេខផ្លូវ',
      class: 'ថ្នាក់',
      status: 'ស្ថានភាព',
      surface: 'ផ្ទៃ',
      nameEn: 'ឈ្មោះ (EN)',
      nameKm: 'ឈ្មោះ (KM)',
      level: 'កម្រិត',
      parent: 'មេ',
      clearSurface: '(គ្មានទិន្នន័យ)',
      note: 'កំណត់ចំណាំ',
      save: 'រក្សាទុក',
      saving: 'កំពុងរក្សាទុក…',
      saved: 'បានរក្សាទុក ✓ នឹងបង្ហាញនៅលើផែនទីបន្ទាប់ពីធ្វើបច្ចុប្បន្នភាពទិន្នន័យ',
      saveError: 'មិនអាចរក្សាទុកបានទេ៖',
    }
  : {
      road: 'Road',
      close: 'Close',
      name: 'Name',
      roadNo: 'Road no.',
      class: 'Class',
      status: 'Status',
      surface: 'Surface',
      nameEn: 'Name (EN)',
      nameKm: 'Name (KM)',
      level: 'Level',
      parent: 'Parent',
      clearSurface: '(no data)',
      note: 'Note',
      save: 'Save',
      saving: 'Saving…',
      saved: 'Saved ✓ — will appear on the map after the next data refresh',
      saveError: 'Could not save:',
    })

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

function close() {
  state.selected.value = null
}

function statusLabel(status: keyof typeof STATUS_LABEL) {
  return props.lang === 'km' ? statusTextKm[String(status)] ?? STATUS_LABEL[status] : STATUS_LABEL[status]
}

function adminLabel(level: keyof typeof ADMIN_LABEL) {
  return props.lang === 'km' ? adminTextKm[String(level)] ?? ADMIN_LABEL[level] : ADMIN_LABEL[level]
}

// --- Inline road editing (only reachable once EditModeToggle sets a token) ---
const editSurface = ref('')
const editStatus = ref<RoadStatus>('built')
const editNote = ref('')
const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const saveErrorMessage = ref('')

watch(sel, (s) => {
  saveState.value = 'idle'
  editNote.value = ''
  if (s?.kind === 'road' && s.road) {
    editSurface.value = s.road.surface ?? ''
    editStatus.value = s.road.status
  }
}, { immediate: true })

async function saveEdit() {
  if (sel.value?.kind !== 'road' || !sel.value.road) return
  saveState.value = 'saving'
  saveErrorMessage.value = ''
  try {
    await gh.saveOverride(sel.value.road.id, {
      surface: editSurface.value,
      status: editStatus.value,
      note: editNote.value,
    })
    saveState.value = 'saved'
  } catch (err) {
    saveState.value = 'error'
    saveErrorMessage.value = err instanceof GithubApiError ? err.message : String(err)
  }
}
</script>

<template>
  <aside v-if="sel" class="info">
    <header class="info__head">
      <h2 class="info__title">
        {{ sel.kind === 'road' ? text.road : adminLabel(sel.admin!.level) }}
      </h2>
      <button type="button" class="info__close" :aria-label="text.close" @click="close">×</button>
    </header>

    <dl v-if="sel.kind === 'road' && sel.road && !gh.hasToken.value" class="info__list">
      <div v-if="sel.road.name"><dt>{{ text.name }}</dt><dd>{{ sel.road.name }}</dd></div>
      <div v-if="sel.road.ref"><dt>{{ text.roadNo }}</dt><dd>{{ sel.road.ref }}</dd></div>
      <div><dt>{{ text.class }}</dt><dd>{{ sel.road.highway }}</dd></div>
      <div><dt>{{ text.status }}</dt><dd>{{ statusLabel(sel.road.status) }}</dd></div>
      <div v-if="sel.road.surface"><dt>{{ text.surface }}</dt><dd>{{ sel.road.surface }}</dd></div>
    </dl>

    <div v-else-if="sel.kind === 'road' && sel.road" class="info__edit">
      <dl class="info__list">
        <div v-if="sel.road.name"><dt>{{ text.name }}</dt><dd>{{ sel.road.name }}</dd></div>
        <div v-if="sel.road.ref"><dt>{{ text.roadNo }}</dt><dd>{{ sel.road.ref }}</dd></div>
        <div><dt>{{ text.class }}</dt><dd>{{ sel.road.highway }}</dd></div>
      </dl>

      <label class="info__field">
        {{ text.surface }}
        <select v-model="editSurface">
          <option value="">{{ text.clearSurface }}</option>
          <optgroup label="Asphalt / paved">
            <option v-for="s in ASPHALT_SURFACES" :key="s" :value="s">{{ s }}</option>
          </optgroup>
          <optgroup label="Concrete">
            <option v-for="s in CONCRETE_SURFACES" :key="s" :value="s">{{ s }}</option>
          </optgroup>
          <optgroup label="Unpaved">
            <option v-for="s in UNPAVED_SURFACES" :key="s" :value="s">{{ s }}</option>
          </optgroup>
        </select>
      </label>

      <label class="info__field">
        {{ text.status }}
        <select v-model="editStatus">
          <option v-for="s in ROAD_STATUSES" :key="s" :value="s">{{ statusLabel(s) }}</option>
        </select>
      </label>

      <label class="info__field">
        {{ text.note }}
        <input v-model="editNote" type="text">
      </label>

      <button type="button" class="info__save" :disabled="saveState === 'saving'" @click="saveEdit">
        {{ saveState === 'saving' ? text.saving : text.save }}
      </button>
      <p v-if="saveState === 'saved'" class="info__feedback info__feedback--ok">{{ text.saved }}</p>
      <p v-if="saveState === 'error'" class="info__feedback info__feedback--error">{{ text.saveError }} {{ saveErrorMessage }}</p>
    </div>

    <dl v-else-if="sel.admin" class="info__list">
      <div v-if="sel.admin.name_en"><dt>{{ text.nameEn }}</dt><dd>{{ sel.admin.name_en }}</dd></div>
      <div v-if="sel.admin.name_km"><dt>{{ text.nameKm }}</dt><dd>{{ sel.admin.name_km }}</dd></div>
      <div><dt>{{ text.level }}</dt><dd>{{ adminLabel(sel.admin.level) }}</dd></div>
      <div v-if="sel.admin.pcode"><dt>PCODE</dt><dd>{{ sel.admin.pcode }}</dd></div>
      <div v-if="sel.admin.parent_pcode"><dt>{{ text.parent }}</dt><dd>{{ sel.admin.parent_pcode }}</dd></div>
    </dl>
  </aside>
</template>

<style lang="scss" scoped>
.info {
  position: absolute;
  bottom: 1.75rem;
  right: 1rem;
  width: 260px;
  // Same reasoning as the layer panel: cap height to the viewport so a
  // feature with lots of fields scrolls internally instead of running off
  // the top of a short screen.
  max-height: calc(100dvh - 1.75rem - 1rem);
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

  &__close {
    border: none;
    background: none;
    font-size: 1.4rem;
    line-height: 1;
    cursor: pointer;
    color: $color-text-muted;
  }

  &__list {
    margin: 0;
    padding: 0.7rem 0.85rem;
    overflow-y: auto;
    min-height: 0;

    > div {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.22rem 0;
      font-size: 0.86rem;
    }

    dt {
      color: $color-text-muted;
      flex: none;
    }

    dd {
      margin: 0;
      text-align: right;
      word-break: break-word;
    }
  }

  &__edit {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.7rem 0.85rem;
    overflow-y: auto;
    min-height: 0;

    .info__list {
      padding: 0;
      overflow: visible;
    }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.82rem;

    select,
    input[type='text'] {
      font: inherit;
      color: $color-text;
      background: $color-bg;
      border: 1px solid $color-border;
      border-radius: 6px;
      padding: 0.35rem 0.5rem;
    }
  }

  &__save {
    border: none;
    background: $color-accent;
    color: $color-bg;
    font-weight: 600;
    border-radius: 6px;
    padding: 0.4rem 0.7rem;
    font-size: 0.85rem;
    cursor: pointer;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__feedback {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.35;

    &--ok {
      color: $color-accent;
    }

    &--error {
      color: #d64545;
    }
  }
}

@media (max-width: 600px) {
  .info {
    width: calc(100vw - 2rem);
    left: 1rem;
    right: 1rem;
    // Clears MapCredits' footer bar, which spans the full width on mobile
    // (see MapCredits.vue) and would otherwise sit under this panel.
    bottom: 3.25rem;
    max-height: calc(100dvh - 3.25rem - 1rem);
  }
}
</style>
