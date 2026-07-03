// Single source of truth for deriving a road's development status and class
// from raw OSM tags. Imported by the pipeline and exercised by unit tests.

/** @typedef {'built'|'under_construction'|'proposed'} RoadStatus */
/** @typedef {'motorway'|'trunk'|'primary'|'secondary'|'tertiary'|'residential'|'track'|'other'} RoadClass */

const KEEP_CLASSES = new Set([
  'motorway',
  'trunk',
  'primary',
  'secondary',
  'tertiary',
  'residential',
  'track',
])

/**
 * Decide whether an OSM way is a road we keep, and if so its status + class.
 * Returns null for ways that are not roads we care about.
 *
 * @param {Record<string, string>} tags - OSM tags for the way.
 * @returns {{ status: RoadStatus, highway: RoadClass } | null}
 */
export function deriveRoad(tags) {
  if (!tags || typeof tags !== 'object') return null
  const highway = tags.highway

  // Proposed / planned roads.
  if (highway === 'proposed' || tags.proposed) {
    return { status: 'proposed', highway: classOf(tags.proposed || tags.construction) }
  }

  // Under construction.
  if (highway === 'construction') {
    return { status: 'under_construction', highway: classOf(tags.construction) }
  }

  // Built roads: must be a class we keep.
  if (highway && KEEP_CLASSES.has(highway)) {
    return { status: 'built', highway: /** @type {RoadClass} */ (highway) }
  }

  return null
}

/**
 * Normalize an intended-class string (from construction or proposed tags) to a
 * known RoadClass, falling back to 'other'.
 * @param {string | undefined} value
 * @returns {RoadClass}
 */
export function classOf(value) {
  return value && KEEP_CLASSES.has(value) ? /** @type {RoadClass} */ (value) : 'other'
}

/**
 * Pick the road-number ref, trimming OSM's ";"-separated multi-values.
 * @param {Record<string, string>} tags
 * @returns {string | undefined}
 */
export function refOf(tags) {
  const ref = tags?.ref
  return ref ? ref.split(';')[0].trim() : undefined
}
