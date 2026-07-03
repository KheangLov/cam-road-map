// Combine all geojsonl layers into a single cambodia.pmtiles archive.
import { writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { config } from './config.mjs'
import { ensureDirs, ensureTool, run, WORK, OUT_DATA, isoToday } from './lib/util.mjs'

/**
 * @param {Record<string, string>} layers - map of layerName -> geojsonl path.
 */
export function buildTiles(layers) {
  ensureDirs()
  ensureTool('tippecanoe', 'https://github.com/felt/tippecanoe (brew install tippecanoe / build from source)')

  const out = resolve(OUT_DATA, config.tiles.output)
  const args = [
    '-o', out,
    '--force',
    '-Z', String(config.tiles.minZoom),
    '-z', String(config.tiles.maxZoom),
    '--drop-densest-as-needed',
    '--extend-zooms-if-still-dropping',
    '--simplification', '4',
  ]

  let added = 0
  for (const [name, file] of Object.entries(layers)) {
    if (!file || !existsSync(file)) {
      console.warn(`⚠ layer "${name}": missing ${file} — skipping.`)
      continue
    }
    args.push('-L', `${name}:${file}`)
    added++
  }
  if (added === 0) throw new Error('No input layers found. Run data:roads / data:boundaries first.')

  run('tippecanoe', args)

  writeFileSync(
    resolve(OUT_DATA, 'meta.json'),
    JSON.stringify({ updatedAt: isoToday(), layers: Object.keys(layers) }, null, 2),
  )
  console.log(`\n✓ tiles → ${out}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // Default to whatever the previous steps produced in .work.
  const layers = {
    roads: resolve(WORK, 'roads.geojsonl'),
    adm1: resolve(WORK, 'adm1.geojsonl'),
    adm2: resolve(WORK, 'adm2.geojsonl'),
    adm3: resolve(WORK, 'adm3.geojsonl'),
    villages: resolve(WORK, 'villages.geojsonl'),
  }
  buildTiles(layers)
}
