<script setup lang="ts">
import type { SearchResult } from '~/types'

type AppLang = 'en' | 'km'

const props = defineProps<{
  lang: AppLang
}>()

const roadMap = useRoadMap()

const term = ref('')
const results = ref<SearchResult[]>([])
const open = ref(false)
const placeholder = computed(() => props.lang === 'km' ? 'ស្វែងរកផ្លូវ (NR1...) ឬទីកន្លែង' : 'Search roads (NR1...) or places')

function runSearch() {
  results.value = roadMap.search(term.value)
  open.value = results.value.length > 0
}

function pick(r: SearchResult) {
  if (r.bbox) roadMap.flyToBounds(r.bbox)
  open.value = false
  term.value = r.label
}

function resultKind(kind: SearchResult['kind']) {
  if (props.lang === 'km') return kind === 'road' ? 'ផ្លូវ' : 'រដ្ឋបាល'
  return kind
}
</script>

<template>
  <div class="search">
    <input
      v-model="term"
      class="search__input"
      type="search"
      :placeholder="placeholder"
      @input="runSearch"
      @focus="open = results.length > 0"
    >
    <ul v-if="open" class="search__list">
      <li v-for="(r, i) in results" :key="i">
        <button type="button" class="search__item" @click="pick(r)">
          <span class="search__badge" :class="`search__badge--${r.kind}`">{{ resultKind(r.kind) }}</span>
          <span class="search__label">{{ r.label }}</span>
          <span v-if="r.sublabel" class="search__sub">{{ r.sublabel }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.search {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: min(420px, calc(100vw - 2rem));
  z-index: 10;

  &__input {
    width: 100%;
    padding: 0.6rem 0.9rem;
    border: 1px solid $color-border;
    border-radius: $radius;
    background: $color-surface;
    box-shadow: $shadow;
    font-size: 0.9rem;
    outline: none;

    &:focus {
      border-color: $color-accent;
    }
  }

  &__list {
    list-style: none;
    margin: 0.4rem 0 0;
    padding: 0.25rem;
    background: $color-surface;
    border-radius: $radius;
    box-shadow: $shadow;
    max-height: 320px;
    overflow-y: auto;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    border: none;
    background: none;
    padding: 0.45rem 0.55rem;
    border-radius: 6px;
    cursor: pointer;
    text-align: left;
    font-size: 0.88rem;

    &:hover {
      background: $color-bg;
    }
  }

  &__badge {
    font-size: 0.66rem;
    text-transform: uppercase;
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    color: #fff;
    flex: none;

    &--road { background: $color-accent; }
    &--admin { background: #8e44ad; }
  }

  &__sub {
    margin-left: auto;
    color: $color-text-muted;
    font-size: 0.78rem;
  }
}
</style>
