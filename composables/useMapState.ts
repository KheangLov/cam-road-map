import type { RoadStatus, AdminLevel, RoadProperties, AdminProperties } from '~/types'
import { ROAD_STATUSES, ADMIN_LEVELS } from '~/utils/mapConfig'

export type LabelLang = 'en' | 'km'

export interface SelectedFeature {
  kind: 'road' | 'admin'
  road?: RoadProperties
  admin?: AdminProperties
}

/**
 * SSR-safe shared UI state for the map (toggles, labels, selection).
 * Plain reactive refs via `useState` so server and client agree on first paint.
 */
export function useMapState() {
  const visibleStatuses = useState<Set<RoadStatus>>('visibleStatuses', () => new Set(ROAD_STATUSES))
  const visibleAdmin = useState<Set<AdminLevel>>('visibleAdmin', () => new Set<AdminLevel>(['adm1']))
  const labelLang = useState<LabelLang>('labelLang', () => 'en')
  const selected = useState<SelectedFeature | null>('selectedFeature', () => null)
  const mapReady = useState<boolean>('mapReady', () => false)

  function toggleStatus(status: RoadStatus) {
    const next = new Set(visibleStatuses.value)
    if (next.has(status)) {
      next.delete(status)
    } else {
      next.add(status)
    }
    visibleStatuses.value = next
  }

  function toggleAdmin(level: AdminLevel) {
    const next = new Set(visibleAdmin.value)
    if (next.has(level)) {
      next.delete(level)
    } else {
      next.add(level)
    }
    visibleAdmin.value = next
  }

  function setLabelLang(lang: LabelLang) {
    labelLang.value = lang
  }

  function isStatusVisible(status: RoadStatus) {
    return visibleStatuses.value.has(status)
  }
  function isAdminVisible(level: AdminLevel) {
    return visibleAdmin.value.has(level)
  }

  return {
    visibleStatuses,
    visibleAdmin,
    labelLang,
    selected,
    mapReady,
    allStatuses: ROAD_STATUSES,
    allAdminLevels: ADMIN_LEVELS,
    toggleStatus,
    toggleAdmin,
    setLabelLang,
    isStatusVisible,
    isAdminVisible,
  }
}
