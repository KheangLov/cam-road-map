<script setup lang="ts">
import { STATUS_LABEL } from '~/utils/mapConfig'
import { ADMIN_LABEL } from '~/types'

type AppLang = 'en' | 'km'

const props = defineProps<{
  lang: AppLang
}>()
const state = useMapState()
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
</script>

<template>
  <aside v-if="sel" class="info">
    <header class="info__head">
      <h2 class="info__title">
        {{ sel.kind === 'road' ? text.road : adminLabel(sel.admin!.level) }}
      </h2>
      <button type="button" class="info__close" :aria-label="text.close" @click="close">×</button>
    </header>

    <dl v-if="sel.kind === 'road' && sel.road" class="info__list">
      <div v-if="sel.road.name"><dt>{{ text.name }}</dt><dd>{{ sel.road.name }}</dd></div>
      <div v-if="sel.road.ref"><dt>{{ text.roadNo }}</dt><dd>{{ sel.road.ref }}</dd></div>
      <div><dt>{{ text.class }}</dt><dd>{{ sel.road.highway }}</dd></div>
      <div><dt>{{ text.status }}</dt><dd>{{ statusLabel(sel.road.status) }}</dd></div>
      <div v-if="sel.road.surface"><dt>{{ text.surface }}</dt><dd>{{ sel.road.surface }}</dd></div>
    </dl>

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
}

@media (max-width: 600px) {
  .info {
    width: calc(100vw - 2rem);
    left: 1rem;
    right: 1rem;
  }
}
</style>
