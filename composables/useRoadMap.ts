import type { Map as MlMap, MapGeoJSONFeature, LngLatBoundsLike } from 'maplibre-gl'
import type { RoadStatus, AdminLevel } from '~/types'
import { SOURCE_LAYER } from '~/types'
import {
  CAMBODIA_BOUNDS,
  CAMBODIA_CENTER,
  DEFAULT_ZOOM,
  ADMIN_COLOR,
  ADMIN_MIN_ZOOM,
  ROAD_STATUSES,
  ADMIN_LEVELS,
} from '~/utils/mapConfig'
import type { LabelLang } from '~/composables/useMapState'

const PMTILES_SOURCE = 'cambodia'
const VILLAGE_SOURCE_LAYER_CANDIDATES = [
  SOURCE_LAYER.villages,
  'village',
  'places',
  'settlements',
]

/** Dash pattern per status; omitted (solid) for built roads. */
const STATUS_DASH: Partial<Record<RoadStatus, [number, number]>> = {
  under_construction: [2, 1.5],
  proposed: [1, 1.5],
}

type RoadSurfaceCategory = 'asphalt' | 'concrete' | 'unpaved' | 'unknown'

const ROAD_SURFACE_COLOR: Record<RoadSurfaceCategory, string> = {
  asphalt: '#2563eb',
  concrete: '#0f766e',
  unpaved: '#b7791f',
  unknown: '#d1d5db',
}

const ROAD_LABEL_MIN_ZOOM = 11
const SEARCH_RESULT_LIMIT = 16
const ASPHALT_SURFACES = ['asphalt', 'paved', 'chipseal']
const CONCRETE_SURFACES = ['concrete', 'concrete:lanes', 'concrete:plates']
const UNPAVED_SURFACES = ['unpaved', 'compacted', 'fine_gravel', 'gravel', 'dirt', 'earth', 'ground', 'sand']

export const ROAD_SURFACE_LEGEND_HINT = 'Road colors show surface type when available. Dashed lines still show roads under construction or proposed.'

export const ROAD_SURFACE_LEGEND: Array<{
  key: RoadSurfaceCategory
  label: string
  description: string
  hint: string
  color: string
  surfaces: string[]
}> = [
  {
    key: 'asphalt',
    label: 'Asphalt / paved',
    description: 'Sealed roads for normal traffic.',
    hint: 'Blue roads are paved, usually asphalt or similar sealed surface.',
    color: ROAD_SURFACE_COLOR.asphalt,
    surfaces: ASPHALT_SURFACES,
  },
  {
    key: 'concrete',
    label: 'Concrete',
    description: 'Concrete slab or lane roads.',
    hint: 'Teal roads are mapped as concrete surfaces.',
    color: ROAD_SURFACE_COLOR.concrete,
    surfaces: CONCRETE_SURFACES,
  },
  {
    key: 'unpaved',
    label: 'Unpaved',
    description: 'Gravel, dirt, compacted, or earth roads.',
    hint: 'Amber roads may be rougher surfaces like gravel, dirt, or compacted earth.',
    color: ROAD_SURFACE_COLOR.unpaved,
    surfaces: UNPAVED_SURFACES,
  },
  {
    key: 'unknown',
    label: 'Unknown surface',
    description: 'Roads without surface data yet.',
    hint: 'Light gray roads do not have surface information in the current map data.',
    color: ROAD_SURFACE_COLOR.unknown,
    surfaces: [],
  },
]

function roadLayerId(status: RoadStatus) {
  return `roads-${status}`
}

function roadLabelId(status: RoadStatus) {
  return `roads-${status}-label`
}

/** Per-level layer ids generated for fills, outlines, and labels. */
function adminFillId(l: AdminLevel) {
  return `${l}-fill`
}
function adminLineId(l: AdminLevel) {
  return `${l}-line`
}
function adminLabelId(l: AdminLevel) {
  return `${l}-label`
}
function villageCircleId(sourceLayer: string) {
  return `village-${sourceLayer}-circle`
}
function villageLabelId(sourceLayer: string) {
  return `village-${sourceLayer}-label`
}

/**
 * Owns the MapLibre instance for the Cambodia road + boundary map.
 * Client-only: call `createMap` from `onMounted`.
 */
export function useRoadMap() {
  const config = useRuntimeConfig()
  let map: MlMap | null = null
  const roadSurfaceLegend = ROAD_SURFACE_LEGEND
  const roadSurfaceLegendHint = ROAD_SURFACE_LEGEND_HINT

  const toBrowserUrl = (value: string) => {
    if (!import.meta.client || hasUrlScheme(value)) return value
    return new URL(value, window.location.origin).toString()
  }

  const roadSublabel = (ref: string, name: string, surfaceLabel: string) => {
    const parts = [ref && name ? ref : '', surfaceLabel].filter(Boolean)
    return parts.length ? parts.join(' - ') : undefined
  }

  const getRoadSurfaceCategory = (properties: MapGeoJSONFeature['properties']): RoadSurfaceCategory => {
    const surface = featureText(properties, ['surface', 'surface_type', 'pavement']).toLocaleLowerCase()
    if (ASPHALT_SURFACES.includes(surface)) return 'asphalt'
    if (CONCRETE_SURFACES.includes(surface)) return 'concrete'
    if (UNPAVED_SURFACES.includes(surface)) return 'unpaved'
    return 'unknown'
  }

  const getRoadSurfaceLabel = (properties: MapGeoJSONFeature['properties']) => {
    const category = getRoadSurfaceCategory(properties)
    if (category === 'asphalt') return 'Asphalt / paved'
    if (category === 'concrete') return 'Concrete'
    if (category === 'unpaved') return 'Unpaved'
    return 'Surface unknown'
  }

  const surfaceColorExpression = (): import('maplibre-gl').ExpressionSpecification => [
    'match',
    ['get', 'surface'],
    ASPHALT_SURFACES,
    ROAD_SURFACE_COLOR.asphalt,
    CONCRETE_SURFACES,
    ROAD_SURFACE_COLOR.concrete,
    UNPAVED_SURFACES,
    ROAD_SURFACE_COLOR.unpaved,
    ROAD_SURFACE_COLOR.unknown,
  ]

  async function createMap(container: HTMLElement): Promise<MlMap> {
    const maplibre = await import('maplibre-gl')
    const { Protocol } = await import('pmtiles')

    // Register the pmtiles:// protocol once per page.
    const protocol = new Protocol()
    maplibre.addProtocol('pmtiles', protocol.tile)

    const basemapStyleUrl = requiredPublicConfigValue(
      'basemapStyleUrl',
      config.public.basemapStyleUrl,
    )

    map = new maplibre.Map({
      container,
      style: toBrowserUrl(basemapStyleUrl),
      center: CAMBODIA_CENTER,
      zoom: DEFAULT_ZOOM,
      maxBounds: padBounds(CAMBODIA_BOUNDS, 2),
      attributionControl: { compact: true },
    })

    map.addControl(new maplibre.NavigationControl({ showCompass: true }), 'top-right')
    map.addControl(new maplibre.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showAccuracyCircle: true,
      showUserHeading: true,
    }), 'top-right')

    await new Promise<void>((resolve, reject) => {
      const onLoad = () => {
        map?.off('error', onError)
        resolve()
      }
      const onError = (event: unknown) => {
        map?.off('load', onLoad)
        reject(toMapLoadError(event))
      }
      map!.once('load', onLoad)
      map!.once('error', onError)
    })
    addDataLayers()
    return map
  }

  function addDataLayers() {
    if (!map) return
    const pmtilesUrl = requiredPublicConfigValue('pmtilesUrl', config.public.pmtilesUrl)
    const url = `pmtiles://${toBrowserUrl(pmtilesUrl)}`

    map.addSource(PMTILES_SOURCE, { type: 'vector', url })

    // --- Roads: one layer per status (line-dasharray can't be data-driven) ---
    for (const status of ROAD_STATUSES) {
      map.addLayer({
        id: roadLayerId(status),
        type: 'line',
        source: PMTILES_SOURCE,
        'source-layer': SOURCE_LAYER.roads,
        filter: ['==', ['get', 'status'], status],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': surfaceColorExpression(),
          ...(STATUS_DASH[status] ? { 'line-dasharray': STATUS_DASH[status] } : {}),
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            5, classWidth(0.5),
            10, classWidth(1.4),
            14, classWidth(3),
          ],
        },
      })

      map.addLayer({
        id: roadLabelId(status),
        type: 'symbol',
        source: PMTILES_SOURCE,
        'source-layer': SOURCE_LAYER.roads,
        minzoom: ROAD_LABEL_MIN_ZOOM,
        filter: [
          'all',
          ['==', ['get', 'status'], status],
          ['has', 'name'],
        ],
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 320,
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Regular', 'Noto Sans Regular'],
          'text-size': [
            'interpolate', ['linear'], ['zoom'],
            11, 10,
            14, 12,
            17, 14,
          ],
          'text-rotation-alignment': 'map',
          'text-pitch-alignment': 'viewport',
          'text-max-angle': 30,
          'text-padding': 2,
          'text-allow-overlap': false,
          'text-ignore-placement': false,
        },
        paint: {
          'text-color': '#243447',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
          'text-halo-blur': 0.5,
        },
      })
    }

    // --- Admin boundaries: fill + outline + label per level ---
    for (const level of ADMIN_LEVELS) {
      const visible = level === 'adm1'

      if (level === 'village') {
        addVillageLayers()
        continue
      }

      const sourceLayer = SOURCE_LAYER[level]
      map.addLayer({
        id: adminFillId(level),
        type: 'fill',
        source: PMTILES_SOURCE,
        'source-layer': sourceLayer,
        minzoom: ADMIN_MIN_ZOOM[level],
        layout: { visibility: visible ? 'visible' : 'none' },
        paint: { 'fill-color': ADMIN_COLOR[level], 'fill-opacity': 0.04 },
      })
      map.addLayer({
        id: adminLineId(level),
        type: 'line',
        source: PMTILES_SOURCE,
        'source-layer': sourceLayer,
        minzoom: ADMIN_MIN_ZOOM[level],
        layout: { visibility: visible ? 'visible' : 'none' },
        paint: {
          'line-color': ADMIN_COLOR[level],
          'line-width': level === 'adm1' ? 1.6 : level === 'adm2' ? 1.1 : 0.7,
          'line-opacity': 0.8,
        },
      })
      map.addLayer({
        id: adminLabelId(level),
        type: 'symbol',
        source: PMTILES_SOURCE,
        'source-layer': sourceLayer,
        minzoom: ADMIN_MIN_ZOOM[level] + 1,
        layout: {
          visibility: visible ? 'visible' : 'none',
          'text-field': labelField('en'),
          'text-size': level === 'adm1' ? 13 : 11,
          'text-font': ['Open Sans Regular', 'Noto Sans Regular'],
        },
        paint: {
          'text-color': ADMIN_COLOR[level],
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.4,
        },
      })
    }

    moveRoadLayersToTop()
  }

  function addVillageLayers() {
    if (!map) return
    for (const sourceLayer of VILLAGE_SOURCE_LAYER_CANDIDATES) {
      map.addLayer({
        id: villageCircleId(sourceLayer),
        type: 'circle',
        source: PMTILES_SOURCE,
        'source-layer': sourceLayer,
        minzoom: ADMIN_MIN_ZOOM.village,
        layout: { visibility: 'none' },
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            12, 2.5,
            15, 4,
          ],
          'circle-color': ADMIN_COLOR.village,
          'circle-stroke-width': 0.8,
          'circle-stroke-color': '#ffffff',
        },
      })
      map.addLayer({
        id: villageLabelId(sourceLayer),
        type: 'symbol',
        source: PMTILES_SOURCE,
        'source-layer': sourceLayer,
        minzoom: ADMIN_MIN_ZOOM.village,
        layout: {
          visibility: 'none',
          'text-field': labelField('en'),
          'text-size': [
            'interpolate', ['linear'], ['zoom'],
            12, 10,
            15, 12,
          ],
          'text-offset': [0, 0.9],
          'text-font': ['Open Sans Regular', 'Noto Sans Regular'],
          'text-allow-overlap': false,
          'text-ignore-placement': false,
        },
        paint: {
          'text-color': ADMIN_COLOR.village,
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.4,
        },
      })
    }
  }

  function moveRoadLayersToTop() {
    if (!map) return
    for (const status of ROAD_STATUSES) {
      const lineId = roadLayerId(status)
      const labelId = roadLabelId(status)
      if (map.getLayer(lineId)) map.moveLayer(lineId)
      if (map.getLayer(labelId)) map.moveLayer(labelId)
    }
  }

  // --- Public controls ---

  function setStatusVisibility(visible: Set<RoadStatus>) {
    if (!map) return
    for (const status of ROAD_STATUSES) {
      const visibility = visible.has(status) ? 'visible' : 'none'
      for (const id of [roadLayerId(status), roadLabelId(status)]) {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibility)
      }
    }
  }

  function setAdminVisibility(level: AdminLevel, visible: boolean) {
    if (!map) return
    const v = visible ? 'visible' : 'none'
    const ids = level === 'village'
      ? VILLAGE_SOURCE_LAYER_CANDIDATES.flatMap((sourceLayer) => [
          villageCircleId(sourceLayer),
          villageLabelId(sourceLayer),
        ])
      : [adminFillId(level), adminLineId(level), adminLabelId(level)]
    for (const id of ids) {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v)
    }
  }

  function setLabelLang(lang: LabelLang) {
    if (!map) return
    const field = labelField(lang)
    for (const level of ADMIN_LEVELS) {
      const ids = level === 'village'
        ? VILLAGE_SOURCE_LAYER_CANDIDATES.map(villageLabelId)
        : [adminLabelId(level)]
      for (const id of ids) {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'text-field', field as never)
      }
    }
  }

  function fitToCambodia() {
    map?.fitBounds(CAMBODIA_BOUNDS as LngLatBoundsLike, { padding: 30, duration: 600 })
  }

  function flyToBounds(bbox: [number, number, number, number]) {
    map?.fitBounds(bbox as LngLatBoundsLike, { padding: 60, duration: 800, maxZoom: 13 })
  }

  function onClickFeature(handler: (f: MapGeoJSONFeature) => void) {
    if (!map) return
    const layers = [
      ...ROAD_STATUSES.map(roadLayerId),
      ...ADMIN_LEVELS.filter((level) => level !== 'village').map(adminFillId),
      ...VILLAGE_SOURCE_LAYER_CANDIDATES.map(villageCircleId),
    ]
    map.on('click', (e) => {
      const feats = map!.queryRenderedFeatures(e.point, { layers: layers.filter((l) => map!.getLayer(l)) })
      if (feats.length) handler(feats[0])
    })
    for (const l of layers) {
      map.on('mouseenter', l, () => { if (map) map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', l, () => { if (map) map.getCanvas().style.cursor = '' })
    }
  }

  /**
   * Search loaded tiles for roads and admin units matching `term`.
   * Note: only features in currently-loaded tiles are searchable (vector-tile
   * limitation); zoom out first for country-wide hits. Good enough for jump-to.
   */
  function search(term: string): import('~/types').SearchResult[] {
    const q = normalizeSearch(term)
    if (!map || q.length < 2 || !map.getSource(PMTILES_SOURCE)) return []

    const out: import('~/types').SearchResult[] = []
    const seen = new Set<string>()

    const roadFeats = map.querySourceFeatures(PMTILES_SOURCE, { sourceLayer: SOURCE_LAYER.roads })
    for (const f of roadFeats) {
      const name = featureText(f.properties, ['name', 'name_en', 'name_km'])
      const ref = featureText(f.properties, ['ref', 'road_ref', 'route_ref'])
      if (!normalizeSearch(`${name} ${ref}`).includes(q)) continue
      const key = `road:${ref}:${name}`
      if (seen.has(key)) continue
      const bbox = bboxOf(f)
      if (!bbox) continue
      seen.add(key)
      out.push({
        kind: 'road',
        label: name || ref,
        sublabel: roadSublabel(ref, name, getRoadSurfaceLabel(f.properties)),
        bbox,
      })
      if (out.length > 8) break
    }

    for (const level of ADMIN_LEVELS) {
      const sourceLayers = level === 'village'
        ? VILLAGE_SOURCE_LAYER_CANDIDATES
        : [SOURCE_LAYER[level]]
      for (const sourceLayer of sourceLayers) {
        for (const f of map.querySourceFeatures(PMTILES_SOURCE, { sourceLayer })) {
          const en = featureText(f.properties, ['name_en', 'name'])
          const km = featureText(f.properties, ['name_km', 'name:km'])
          const pcode = featureText(f.properties, ['pcode', 'code'])
          if (!normalizeSearch(`${en} ${km} ${pcode}`).includes(q)) continue
          const key = `admin:${level}:${pcode || en || km}`
          if (seen.has(key)) continue
          const bbox = bboxOf(f)
          if (!bbox) continue
          seen.add(key)
          out.push({ kind: 'admin', label: en || km, sublabel: pcode || undefined, bbox })
          if (out.length >= SEARCH_RESULT_LIMIT) break
        }
        if (out.length >= SEARCH_RESULT_LIMIT) break
      }
    }
    return out.slice(0, SEARCH_RESULT_LIMIT)
  }

  function getMap() {
    return map
  }

  function destroy() {
    map?.remove()
    map = null
  }

  return {
    createMap,
    setStatusVisibility,
    setAdminVisibility,
    setLabelLang,
    fitToCambodia,
    flyToBounds,
    onClickFeature,
    search,
    roadSurfaceLegend,
    roadSurfaceLegendHint,
    getRoadSurfaceCategory,
    getRoadSurfaceLabel,
    getMap,
    destroy,
  }
}

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase()
}

function featureText(properties: MapGeoJSONFeature['properties'], keys: string[]) {
  const record = properties as Record<string, unknown>
  for (const key of keys) {
    const value = record[key]
    if (value !== undefined && value !== null && String(value).trim()) return String(value)
  }
  return ''
}

function labelField(lang: LabelLang): import('maplibre-gl').ExpressionSpecification {
  return lang === 'km'
    ? ['coalesce', ['get', 'name_km'], ['get', 'name:km'], ['get', 'name'], ['get', 'name_en'], '']
    : ['coalesce', ['get', 'name_en'], ['get', 'name'], ['get', 'name_km'], ['get', 'name:km'], '']
}

function requiredPublicConfigValue(key: string, value: unknown) {
  if (typeof value === 'string' && value.trim()) return value.trim()
  throw new Error(`Missing runtime config public.${key}; map data cannot be loaded.`)
}

function hasUrlScheme(value: string) {
  return /^[a-z][a-z\d+.-]*:/i.test(value)
}

function toMapLoadError(event: unknown) {
  const error = event instanceof Error
    ? event
    : getErrorFromEvent(event)
  return new Error(`Map failed to load: ${error?.message ?? 'unknown fetch error'}`)
}

function getErrorFromEvent(event: unknown) {
  if (!event || typeof event !== 'object' || !('error' in event)) return null
  const error = (event as { error?: unknown }).error
  return error instanceof Error ? error : null
}

/** Compute a [w,s,e,n] bbox from a feature's line/polygon/point geometry. */
function bboxOf(f: MapGeoJSONFeature): [number, number, number, number] | null {
  let minX = 180, minY = 90, maxX = -180, maxY = -90
  const visit = (coords: unknown): void => {
    if (!Array.isArray(coords) || !coords.length) return
    if (typeof (coords as number[])[0] === 'number') {
      const [x, y] = coords as [number, number]
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
      return
    }
    for (const c of coords as unknown[]) visit(c)
  }
  // @ts-expect-error geometry coordinates are nested arrays at runtime
  visit(f.geometry.coordinates)
  if (minX === 180 || minY === 90 || maxX === -180 || maxY === -90) return null
  return [minX, minY, maxX, maxY]
}

/** Per-class width multiplier so trunk roads draw thicker than tracks. */
function classWidth(base: number): import('maplibre-gl').ExpressionSpecification {
  return [
    'match', ['get', 'highway'],
    'motorway', base * 3,
    'trunk', base * 2.4,
    'primary', base * 2,
    'secondary', base * 1.5,
    'tertiary', base * 1.1,
    'residential', base * 0.8,
    'track', base * 0.6,
    base,
  ]
}

/** Expand a bbox by `pad` degrees so the user can pan slightly past the border. */
function padBounds(
  b: [number, number, number, number],
  pad: number,
): [[number, number], [number, number]] {
  return [
    [b[0] - pad, b[1] - pad],
    [b[2] + pad, b[3] + pad],
  ]
}
