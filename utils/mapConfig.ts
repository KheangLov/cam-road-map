import type { RoadStatus, AdminLevel } from '~/types'

/** Cambodia bounding box [west, south, east, north] for fitBounds / default view. */
export const CAMBODIA_BOUNDS: [number, number, number, number] = [102.3, 9.5, 107.7, 14.7]
export const CAMBODIA_CENTER: [number, number] = [104.99, 12.57]
export const DEFAULT_ZOOM = 6.4

/** Status colors used by both the map style and the legend. */
export const STATUS_COLOR: Record<RoadStatus, string> = {
  built: '#1f7a3d',
  under_construction: '#e08a00',
  proposed: '#9aa0a6',
}

export const STATUS_LABEL: Record<RoadStatus, string> = {
  built: 'Built',
  under_construction: 'Under construction',
  proposed: 'Proposed / planned',
}

/** Boundary outline colors per admin level. */
export const ADMIN_COLOR: Record<AdminLevel, string> = {
  adm1: '#3b4cca',
  adm2: '#8e44ad',
  adm3: '#c0392b',
  village: '#d35400',
}

/**
 * Zoom thresholds controlling when each admin level becomes visible.
 * Provinces at country zoom, finer levels only as you zoom in (performance).
 */
export const ADMIN_MIN_ZOOM: Record<AdminLevel, number> = {
  adm1: 0,
  adm2: 8,
  adm3: 10,
  village: 12,
}

/** Order used for legend / panel rendering. */
export const ROAD_STATUSES: RoadStatus[] = ['built', 'under_construction', 'proposed']
export const ADMIN_LEVELS: AdminLevel[] = ['adm1', 'adm2', 'adm3', 'village']
