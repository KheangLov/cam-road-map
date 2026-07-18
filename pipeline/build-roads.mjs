// Build roads.geojsonl from the Cambodia OSM extract, with derived status.
import { createReadStream, createWriteStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'
import { config } from './config.mjs'
import { ensureDirs, ensureTool, download, run, WORK } from './lib/util.mjs'
import { deriveRoad, refOf } from './lib/roadStatus.mjs'

export async function buildRoads() {
  ensureDirs()
  ensureTool('osmium', 'https://osmcode.org/osmium-tool/ (apt install osmium-tool / brew install osmium-tool)')

  const pbf = resolve(WORK, 'cambodia-latest.osm.pbf')
  const roadsPbf = resolve(WORK, 'roads.osm.pbf')
  const rawSeq = resolve(WORK, 'roads-raw.geojsonseq')
  const outJsonl = resolve(WORK, 'roads.geojsonl')

  download(config.osmPbfUrl, pbf)

  // Keep only ways tagged highway=* (built, construction, proposed).
  run('osmium', ['tags-filter', pbf, 'w/highway', '-o', roadsPbf, '--overwrite'])

  // Export to a GeoJSON sequence with all tags as feature properties, plus the
  // real OSM way id/version (`-a`, not `-u/--add-unique-id`, which would mint
  // a synthetic id instead) — needed so road edits (pipeline/overrides/) and
  // the routing graph can key off a stable identifier across weekly rebuilds.
  run('osmium', ['export', roadsPbf, '-f', 'geojsonseq', '-a', 'type,id,version', '-o', rawSeq, '--overwrite'])

  const written = await transform(rawSeq, outJsonl)
  console.log(`✓ roads: ${written} features → ${outJsonl}`)
  return outJsonl
}

/** Map raw OSM features to minimal road features with derived status. */
async function transform(src, dest) {
  const out = createWriteStream(dest)
  const rl = createInterface({ input: createReadStream(src), crlfDelay: Infinity })
  let count = 0

  for await (const rawLine of rl) {
    // osmium geojsonseq prefixes each record with an RS control char (0x1e).
    const line = rawLine.replace(/^\x1e/, '').trim()
    if (!line) continue

    let feat
    try {
      feat = JSON.parse(line)
    } catch {
      continue
    }
    const tags = feat.properties || {}
    const derived = deriveRoad(tags)
    if (!derived) continue

    out.write(
      JSON.stringify({
        type: 'Feature',
        geometry: feat.geometry,
        properties: {
          id: tags['@id'],
          osmVersion: tags['@version'],
          status: derived.status,
          highway: derived.highway,
          ref: refOf(tags),
          name: tags.name || tags['name:en'] || undefined,
          surface: tags.surface || undefined,
        },
      }) + '\n',
    )
    count++
  }

  await new Promise((r) => out.end(r))
  return count
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildRoads().catch((e) => {
    console.error(e.message)
    process.exit(1)
  })
}
