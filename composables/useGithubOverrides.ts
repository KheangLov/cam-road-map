import type { RoadStatus } from '~/types'

const OWNER = 'KheangLov'
const REPO = 'cam-road-map'
const OVERRIDES_PATH = 'pipeline/overrides/roads.json'
const TOKEN_KEY = 'roadOverridesGithubToken'

interface RoadOverridePatch {
  surface?: string
  status?: RoadStatus
  note?: string
}

interface OverridesDoc {
  version: number
  roads: Record<string, { surface?: string, status?: RoadStatus, note?: string, updatedAt: string }>
}

export class GithubApiError extends Error {
  status: number
  constructor(status: number, body: string) {
    super(`GitHub API error ${status}: ${body}`)
    this.status = status
  }
}

type GithubOverridesApi = ReturnType<typeof buildGithubOverrides>
let shared: GithubOverridesApi | null = null

/**
 * On a fully static, GitHub-Pages-deployed site there's no server to hold
 * write credentials, so GitHub itself is the "backend": the admin pastes
 * their own fine-grained PAT (Contents: Read and write on this repo, kept
 * only in localStorage, never bundled/shipped) once, and edits commit
 * straight to pipeline/overrides/roads.json via the Contents API — no
 * separate admin page, no manual file download/upload.
 *
 * Singleton for the same reason as useRoadMap()'s: components that need
 * this (EditModeToggle, FeatureInfo) are siblings, not ancestor/descendant,
 * so provide/inject can't share it — see useRoadMap.ts's comment.
 */
export function useGithubOverrides() {
  if (!shared) shared = buildGithubOverrides()
  return shared
}

function buildGithubOverrides() {
  const token = ref<string | null>(import.meta.client ? localStorage.getItem(TOKEN_KEY) : null)
  const hasToken = computed(() => !!token.value)

  function setToken(value: string) {
    token.value = value.trim()
    if (import.meta.client) localStorage.setItem(TOKEN_KEY, token.value)
  }

  function clearToken() {
    token.value = null
    if (import.meta.client) localStorage.removeItem(TOKEN_KEY)
  }

  function authHeaders() {
    return {
      Authorization: `Bearer ${token.value}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
  }

  async function getOverridesDoc(): Promise<{ doc: OverridesDoc, sha?: string }> {
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${OVERRIDES_PATH}?ref=main`,
      { headers: authHeaders() },
    )
    if (res.status === 404) return { doc: { version: 1, roads: {} } }
    if (!res.ok) throw new GithubApiError(res.status, await safeText(res))
    const body = await res.json()
    return { doc: JSON.parse(decodeBase64Utf8(body.content)), sha: body.sha }
  }

  /**
   * Read-modify-write a single road's override. One automatic retry on a
   * 409 (stale sha — someone/something else wrote the file between our GET
   * and PUT): re-fetch, reapply this one patch, try once more. A second
   * 409 is surfaced as a real error rather than retried forever.
   */
  async function saveOverride(wayId: number, patch: RoadOverridePatch, attempt = 0): Promise<void> {
    if (!token.value) throw new Error('No GitHub token set — call setToken() first.')

    const { doc, sha } = await getOverridesDoc()

    const entry: OverridesDoc['roads'][string] = { updatedAt: new Date().toISOString() }
    if (patch.surface !== undefined) entry.surface = patch.surface
    if (patch.status !== undefined) entry.status = patch.status
    if (patch.note) entry.note = patch.note
    doc.roads[String(wayId)] = entry
    doc.roads = Object.fromEntries(
      Object.entries(doc.roads).sort(([a], [b]) => Number(a) - Number(b)),
    )

    const putRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${OVERRIDES_PATH}`,
      {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          message: describeSave(wayId, patch),
          content: encodeBase64Utf8(JSON.stringify(doc, null, 2)),
          ...(sha ? { sha } : {}),
          branch: 'main',
        }),
      },
    )

    if (putRes.status === 409 && attempt === 0) {
      return saveOverride(wayId, patch, attempt + 1)
    }
    if (!putRes.ok) throw new GithubApiError(putRes.status, await safeText(putRes))
  }

  /** Manually kick the weekly data-refresh workflow so an edit shows up on the live map without waiting for Monday. Needs the token's Actions: Read and write scope. */
  async function triggerRebuild(): Promise<void> {
    if (!token.value) throw new Error('No GitHub token set — call setToken() first.')
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/data-refresh.yml/dispatches`,
      { method: 'POST', headers: authHeaders(), body: JSON.stringify({ ref: 'main' }) },
    )
    if (!res.ok) throw new GithubApiError(res.status, await safeText(res))
  }

  return { hasToken, setToken, clearToken, saveOverride, triggerRebuild }
}

function describeSave(wayId: number, patch: RoadOverridePatch) {
  const parts = []
  if (patch.surface !== undefined) parts.push(`surface=${patch.surface || '(cleared)'}`)
  if (patch.status !== undefined) parts.push(`status=${patch.status}`)
  return `Update road ${wayId}: ${parts.join(', ') || 'note only'}`
}

async function safeText(res: Response) {
  try {
    return await res.text()
  } catch {
    return ''
  }
}

// Naive atob/btoa corrupts multi-byte UTF-8 (Khmer note text) — go through
// explicit codecs instead.
function decodeBase64Utf8(b64: string) {
  const bytes = Uint8Array.from(atob(b64.replace(/\n/g, '')), (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function encodeBase64Utf8(str: string) {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}
