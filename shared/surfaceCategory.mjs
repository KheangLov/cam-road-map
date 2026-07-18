// Road surface -> category mapping. Shared between the Node data pipeline
// (surface-weighted routing cost) and the browser bundle (map coloring +
// legend), so the two can never disagree about what counts as "unpaved".
export const ASPHALT_SURFACES = ['asphalt', 'paved', 'chipseal']
export const CONCRETE_SURFACES = ['concrete', 'concrete:lanes', 'concrete:plates']
export const UNPAVED_SURFACES = ['unpaved', 'compacted', 'fine_gravel', 'gravel', 'dirt', 'earth', 'ground', 'sand']

/** @param {string | undefined} surface @returns {'asphalt'|'concrete'|'unpaved'|'unknown'} */
export function surfaceCategory(surface) {
  const s = (surface || '').toLocaleLowerCase()
  if (ASPHALT_SURFACES.includes(s)) return 'asphalt'
  if (CONCRETE_SURFACES.includes(s)) return 'concrete'
  if (UNPAVED_SURFACES.includes(s)) return 'unpaved'
  return 'unknown'
}
