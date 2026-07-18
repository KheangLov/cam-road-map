// Shared domain types for roads and the Cambodian administrative hierarchy.

/** Development status derived from OSM tags by the data pipeline. */
export type RoadStatus = 'built' | 'under_construction' | 'proposed'

/** OSM highway classes we keep, ordered roughly by importance. */
export type RoadClass =
  | 'motorway'
  | 'trunk'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'residential'
  | 'track'
  | 'other'

/** Properties carried on each road feature in the vector tiles. */
export interface RoadProperties {
  /** Stable OSM way id — lets edits (pipeline/overrides/) and the routing graph key off a real identifier across weekly data rebuilds. */
  id: number
  /** OSM way version at the time this feature was last built, for staleness checks against future overrides. */
  osmVersion?: number
  status: RoadStatus
  highway: RoadClass
  /** Road number, e.g. "NR1". */
  ref?: string
  name?: string
  /** OSM surface tag, e.g. "paved" | "unpaved". */
  surface?: string
}

/** Administrative levels, mirroring Cambodia's hierarchy. */
export type AdminLevel = 'adm1' | 'adm2' | 'adm3' | 'village'

export const ADMIN_LABEL: Record<AdminLevel, string> = {
  adm1: 'Province',
  adm2: 'District',
  adm3: 'Commune',
  village: 'Village',
}

/** Properties carried on each boundary / village feature. */
export interface AdminProperties {
  level: AdminLevel
  /** Official place code (PCODE). */
  pcode: string
  name_en?: string
  name_km?: string
  /** Parent PCODEs for drill-down / breadcrumbs. */
  parent_pcode?: string
}

/** Vector-tile source-layer names inside cambodia.pmtiles. */
export const SOURCE_LAYER = {
  roads: 'roads',
  adm1: 'adm1',
  adm2: 'adm2',
  adm3: 'adm3',
  villages: 'villages',
} as const

/** A normalized search result spanning roads and admin units. */
export interface SearchResult {
  kind: 'road' | 'admin'
  label: string
  sublabel?: string
  bbox?: [number, number, number, number]
  center?: [number, number]
}
