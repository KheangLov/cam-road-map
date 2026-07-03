// Build adm1/adm2/adm3 boundary layers + a villages point layer.
import { createReadStream, createWriteStream, existsSync, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'
import { config } from './config.mjs'
import { ensureDirs, ensureTool, download, run, WORK } from './lib/util.mjs'
import { PROVINCE_NAME_KM, DISTRICT_NAME_KM } from './lib/khmerNames.mjs'

// HDX has no Khmer names at any admin level; fall back to a static lookup
// per level (see khmerNames.mjs for provenance). adm3 has no known source.
const NAME_KM_LOOKUP = { adm1: PROVINCE_NAME_KM, adm2: DISTRICT_NAME_KM }

export async function buildBoundaries() {
  ensureDirs()
  const outputs = {}

  // Download the single HDX bundle once, extract the per-level GeoJSON files.
  const bundle = resolve(WORK, 'khm_boundaries.geojson.zip')
  download(config.boundaries.bundleUrl, bundle)
  const members = Object.values(config.boundaries.members)
  run('unzip', ['-o', '-q', bundle, ...members, '-d', WORK])

  for (const level of ['adm1', 'adm2', 'adm3']) {
    const member = config.boundaries.members[level]
    const geojson = resolve(WORK, member)
    if (!existsSync(geojson)) {
      console.warn(`⚠ ${level}: ${member} not found in bundle — skipping.`)
      continue
    }
    outputs[level] = await buildAdmLevel(level, geojson)
  }

  outputs.villages = await buildVillages()
  return outputs
}

/** Normalize one admin level's GeoJSON to {level}.geojsonl. */
async function buildAdmLevel(level, geojson) {
  const fields = config.boundaryFields[level]
  const outJsonl = resolve(WORK, `${level}.geojsonl`)

  const fc = JSON.parse(readFileSync(geojson, 'utf8'))
  const out = createWriteStream(outJsonl)
  const kmLookup = NAME_KM_LOOKUP[level]
  let count = 0
  for (const f of fc.features || []) {
    const p = f.properties || {}
    const pcode = str(p[fields.pcode])
    out.write(
      JSON.stringify({
        type: 'Feature',
        geometry: f.geometry,
        properties: {
          level,
          pcode,
          name_en: str(p[fields.name_en]),
          name_km: str(p[fields.name_km]) || kmLookup?.[pcode],
          parent_pcode: str(p[fields.parent]),
        },
      }) + '\n',
    )
    count++
  }
  await new Promise((r) => out.end(r))
  console.log(`✓ ${level}: ${count} features → ${outJsonl}`)
  return outJsonl
}

/** Extract place=village points from the OSM extract. */
async function buildVillages() {
  const pbf = resolve(WORK, 'cambodia-latest.osm.pbf')
  if (!existsSync(pbf)) {
    download(config.osmPbfUrl, pbf)
  }
  ensureTool('osmium', 'https://osmcode.org/osmium-tool/')

  const villPbf = resolve(WORK, 'villages.osm.pbf')
  const rawSeq = resolve(WORK, 'villages-raw.geojsonseq')
  const outJsonl = resolve(WORK, 'villages.geojsonl')

  run('osmium', ['tags-filter', pbf, 'n/place=village', '-o', villPbf, '--overwrite'])
  run('osmium', ['export', villPbf, '-f', 'geojsonseq', '-o', rawSeq, '--overwrite'])

  const out = createWriteStream(outJsonl)
  const rl = createInterface({ input: createReadStream(rawSeq), crlfDelay: Infinity })
  let count = 0
  for await (const rawLine of rl) {
    const line = rawLine.replace(/^\x1e/, '').trim()
    if (!line) continue
    let feat
    try {
      feat = JSON.parse(line)
    } catch {
      continue
    }
    if (feat.geometry?.type !== 'Point') continue
    const t = feat.properties || {}
    out.write(
      JSON.stringify({
        type: 'Feature',
        geometry: feat.geometry,
        properties: {
          level: 'village',
          pcode: '',
          name_en: str(t['name:en'] || t.name),
          name_km: str(t['name:km']),
        },
      }) + '\n',
    )
    count++
  }
  await new Promise((r) => out.end(r))
  console.log(`✓ villages: ${count} points → ${outJsonl}`)
  return outJsonl
}

function str(v) {
  return v == null ? undefined : String(v)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildBoundaries().catch((e) => {
    console.error(e.message)
    process.exit(1)
  })
}
