// Merge admin-authored corrections (pipeline/overrides/roads.json) onto a
// freshly-built roads.geojsonl, in place. Must run before both tippecanoe
// (vector tiles) and the routing graph builder consume the file, so a
// correction always wins over the current week's re-scraped OSM data.
import { createReadStream, createWriteStream, existsSync, readFileSync, renameSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'
import { ROOT, WORK } from './lib/util.mjs'

export const OVERRIDES_PATH = resolve(ROOT, 'pipeline', 'overrides', 'roads.json')

export function loadOverrides(overridesPath = OVERRIDES_PATH) {
  if (!existsSync(overridesPath)) return {}
  const doc = JSON.parse(readFileSync(overridesPath, 'utf8'))
  return doc.roads || {}
}

/**
 * Apply {surface, status} overrides onto each matching road (keyed by OSM way
 * id) in `roadsPath`'s geojsonl, overwriting the file in place.
 * @returns {Promise<{ applied: number, stale: string[] }>} `stale` = override
 *   ids that didn't match any current road — the way may have been split,
 *   deleted, or re-imported upstream since the override was authored. Warned,
 *   not thrown: a stale override shouldn't break the weekly build.
 */
export async function applyOverrides(roadsPath, overridesPath = OVERRIDES_PATH) {
  const overrides = loadOverrides(overridesPath)
  const overrideIds = new Set(Object.keys(overrides))
  if (overrideIds.size === 0) return { applied: 0, stale: [] }

  const tmpPath = `${roadsPath}.overrides-tmp`
  const out = createWriteStream(tmpPath)
  const rl = createInterface({ input: createReadStream(roadsPath), crlfDelay: Infinity })
  let applied = 0

  for await (const line of rl) {
    if (!line.trim()) continue
    const feature = JSON.parse(line)
    const key = String(feature.properties?.id ?? '')
    const override = overrides[key]
    if (override) {
      if (override.surface !== undefined) feature.properties.surface = override.surface
      if (override.status !== undefined) feature.properties.status = override.status
      overrideIds.delete(key)
      applied++
    }
    out.write(JSON.stringify(feature) + '\n')
  }

  await new Promise((res) => out.end(res))
  renameSync(tmpPath, roadsPath)

  const stale = [...overrideIds]
  if (stale.length) {
    console.warn(`⚠ ${stale.length} override(s) did not match any current road (way may have changed upstream): ${stale.join(', ')}`)
  }
  return { applied, stale }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const roadsPath = resolve(WORK, 'roads.geojsonl')
  const result = await applyOverrides(roadsPath)
  console.log(`✓ overrides: ${result.applied} applied${result.stale.length ? `, ${result.stale.length} stale` : ''} → ${roadsPath}`)
}
