// Orchestrate the full data build: roads + boundaries + villages → cambodia.pmtiles.
import { buildRoads } from './build-roads.mjs'
import { buildBoundaries } from './build-boundaries.mjs'
import { buildTiles } from './build-tiles.mjs'

async function main() {
  console.log('▶ Building roads…')
  const roads = await buildRoads()

  console.log('\n▶ Building boundaries + villages…')
  const boundaries = await buildBoundaries()

  console.log('\n▶ Generating vector tiles…')
  buildTiles({ roads, ...boundaries })

  console.log('\n✅ Done. public/data/cambodia.pmtiles is ready.')
}

main().catch((e) => {
  console.error('\n❌ Build failed:', e.message)
  process.exit(1)
})
