<script setup lang="ts">
// Unlocks inline road editing directly on the main map — no separate admin
// page. The token itself (not this button) is the real access control: on a
// static, GitHub-Pages-deployed site there's no server to gate a route with,
// so anyone can see this button, but editing only works with a valid
// fine-grained PAT scoped to this one repo. See useGithubOverrides.ts.
const gh = useGithubOverrides()
const open = ref(false)
const tokenInput = ref('')

function enable() {
  if (!tokenInput.value.trim()) return
  gh.setToken(tokenInput.value)
  tokenInput.value = ''
  open.value = false
}

function disable() {
  gh.clearToken()
  open.value = false
}
</script>

<template>
  <div class="edit-toggle">
    <button
      type="button"
      class="edit-toggle__button"
      :class="{ 'is-active': gh.hasToken.value }"
      :title="gh.hasToken.value ? 'Road editing enabled on this device' : 'Enable road editing'"
      @click="open = !open"
    >
      {{ gh.hasToken.value ? '✎' : '🔒' }}
    </button>

    <div v-if="open" class="edit-toggle__panel">
      <template v-if="gh.hasToken.value">
        <p>Editing is enabled on this device — click a road to edit its surface/status.</p>
        <button type="button" class="edit-toggle__action" @click="disable">Disable editing</button>
      </template>
      <template v-else>
        <p>Paste a GitHub fine-grained token (Contents: Read and write on this repo) to edit roads directly from the map.</p>
        <input v-model="tokenInput" type="password" placeholder="github_pat_…" @keyup.enter="enable">
        <button type="button" class="edit-toggle__action" @click="enable">Enable editing</button>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.edit-toggle {
  position: absolute;
  // Every corner of this app has a panel that can grow tall (layer panel
  // top-left, feature-info bottom-right) — this is the one spot nothing
  // else claims: just below MapLibre's own zoom/compass/geolocate controls,
  // which (unlike our own panels) have a small, fixed height that never changes.
  top: 9rem;
  right: 1rem;
  z-index: 11;

  &__button {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 1px solid $color-border;
    background: $color-surface;
    box-shadow: $shadow;
    cursor: pointer;
    font-size: 0.95rem;
    line-height: 1;

    &.is-active {
      background: $color-accent;
      color: $color-bg;
      border-color: transparent;
    }
  }

  &__panel {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    width: 240px;
    background: $color-surface;
    border-radius: $radius;
    box-shadow: $shadow;
    padding: 0.7rem 0.85rem;
    font-size: 0.8rem;
    color: $color-text;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    p {
      margin: 0;
      color: $color-text-muted;
      line-height: 1.35;
    }

    input {
      font: inherit;
      color: $color-text;
      background: $color-bg;
      border: 1px solid $color-border;
      border-radius: 6px;
      padding: 0.35rem 0.5rem;
    }
  }

  &__action {
    border: 1px solid $color-border;
    background: $color-bg;
    color: $color-text;
    border-radius: 6px;
    padding: 0.35rem 0.6rem;
    font-size: 0.8rem;
    cursor: pointer;
  }
}
</style>
