# Cambodia Road Network Map

Interactive web map of Cambodia's **road network** (with development status — built,
under construction, proposed) and **administrative boundaries** (provinces, districts,
communes, and villages as points).

- **Frontend only** — no backend, no database.
- Data ships as a single **PMTiles** vector-tile archive served as a static file.
- Built with **Nuxt 3 + TypeScript + SCSS** and **MapLibre GL JS**.
- "Live" data = a scheduled CI job re-runs the pipeline (weekly) and redeploys.

---

## How it works

```
OSM extract (Geofabrik) ─┐
HDX/NCDD boundaries ─────┼─►  pipeline/  ─►  tippecanoe  ─►  public/data/cambodia.pmtiles
OSM place=village nodes ─┘                                   (layers: roads, adm1, adm2, adm3, villages)
                                                                      │
                                                            MapLibre GL JS (browser)
```

The browser reads `cambodia.pmtiles` directly over HTTP range requests via the
`pmtiles://` protocol — no tile server required.

---

## Quick start (app)

```bash
npm install
npm run dev        # http://localhost:3000
```

Until you generate tiles, the map shows the basemap with empty data layers.
Generate the data (next section), then reload.

---

## Generating the data

### Required tools

| Tool         | Purpose                          | Install |
|--------------|----------------------------------|---------|
| `osmium`     | filter/export OSM roads+villages | `apt install osmium-tool` / `brew install osmium-tool` |
| `tippecanoe` | build vector tiles (PMTiles)     | [felt/tippecanoe](https://github.com/felt/tippecanoe) |
| `ogr2ogr`    | convert boundary shapefiles      | `apt install gdal-bin` / `brew install gdal` (only if a boundary URL is a `.zip`/`.shp`) |
| `curl`       | downloads                        | preinstalled on most systems |

### Configure boundary sources

OSM roads + villages need no config. For boundaries, set the HDX/OCHA COD-AB
resource URLs (province / district / commune) — GeoJSON or zipped shapefile:

```bash
export ADM1_URL="https://.../khm_admbnda_adm1_*.geojson"   # provinces
export ADM2_URL="https://.../khm_admbnda_adm2_*.geojson"   # districts
export ADM3_URL="https://.../khm_admbnda_adm3_*.geojson"   # communes
```

Find them on HDX: search **"Cambodia - Subnational Administrative Boundaries"**
(COD-AB, sourced from NCDD). If a level's URL is unset, the build skips it with a
warning. Field-name mapping (`ADM{n}_PCODE` / `ADM{n}_EN` / `ADM{n}_KH`) lives in
[`pipeline/config.mjs`](pipeline/config.mjs) — adjust if the source schema differs.

### Run the pipeline

```bash
npm run data:all          # roads + boundaries + villages → public/data/cambodia.pmtiles
# or individually:
npm run data:roads
npm run data:boundaries
npm run data:tiles
```

Intermediate downloads/extracts are cached in `pipeline/.work/` (gitignored).
The build also writes `public/data/meta.json` with the build timestamp (shown in
the map's credits bar).

---

## Status derivation (OSM tags → status)

Implemented and unit-tested in [`pipeline/lib/roadStatus.mjs`](pipeline/lib/roadStatus.mjs):

| OSM tags                                   | status               |
|--------------------------------------------|----------------------|
| `highway=motorway\|trunk\|primary\|…`      | `built`              |
| `highway=construction` (+ `construction=*`)| `under_construction` |
| `highway=proposed` or `proposed=*`         | `proposed`           |

```bash
npm test        # vitest
```

---

## Project layout

```
assets/scss/        design tokens + global styles
components/         MapView, LayerPanel, SearchBox, FeatureInfo, MapCredits
composables/        useRoadMap (MapLibre), useMapState (UI state)
utils/mapConfig.ts  colors, zoom thresholds, bounds
types/              road + admin domain types
pipeline/           data build scripts (roads, boundaries, tiles)
public/data/        cambodia.pmtiles (generated) + meta.json
.github/workflows/  scheduled data refresh + Pages deploy
```

---

## Deploy

Static output — deploy anywhere (Cloudflare Pages, Netlify, GitHub Pages):

```bash
npm run generate   # → .output/public
```

The included GitHub Actions workflow ([`.github/workflows/data-refresh.yml`](.github/workflows/data-refresh.yml))
rebuilds the data weekly and deploys to GitHub Pages. Set `ADM1_URL`/`ADM2_URL`/`ADM3_URL`
as repository **Variables**.

---

## Data licensing & attribution

- **Roads / villages:** © OpenStreetMap contributors, **ODbL**. Attribution shown in-app.
- **Boundaries:** HDX / OCHA COD-AB (sourced from Cambodia's **NCDD**) — check the
  dataset's license on HDX and keep the attribution in the credits bar.

Keep both attributions visible in any deployment.

---

## Notes & limits

- **Villages are points, not polygons** — open polygon data for villages isn't
  available nationally, so they're rendered as labeled points (`place=village`),
  and only above zoom 12 to keep the map readable.
- **Search** for roads/provinces/districts/communes matches features in
  currently-loaded tiles (a vector-tile limit); zoom out for country-wide hits.
  Villages are the exception: since tippecanoe thins that many points out of
  low-zoom tiles entirely, they're searched from a small standalone
  `public/data/villages-index.json` (built alongside the tiles — see
  `buildVillagesIndex` in `pipeline/build-tiles.mjs`) instead, so they're
  findable regardless of current zoom/pan. The same prebuilt-index approach
  could be extended to roads/adm2/adm3 later if that limit becomes a problem.
- No backend is needed unless you later merge an authenticated government dataset
  or accept user-submitted edits — see the prompt's "optional backend fork."
