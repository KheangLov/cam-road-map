import { describe, it, expect } from 'vitest'
import { deriveRoad, classOf, refOf } from '../pipeline/lib/roadStatus.mjs'

describe('deriveRoad', () => {
  it('classifies a built primary road', () => {
    expect(deriveRoad({ highway: 'primary' })).toEqual({ status: 'built', highway: 'primary' })
  })

  it('classifies a motorway', () => {
    expect(deriveRoad({ highway: 'motorway' })).toEqual({ status: 'built', highway: 'motorway' })
  })

  it('classifies an under-construction road by intended class', () => {
    expect(deriveRoad({ highway: 'construction', construction: 'trunk' })).toEqual({
      status: 'under_construction',
      highway: 'trunk',
    })
  })

  it('falls back to "other" when construction class is missing', () => {
    expect(deriveRoad({ highway: 'construction' })).toEqual({
      status: 'under_construction',
      highway: 'other',
    })
  })

  it('classifies highway=proposed', () => {
    expect(deriveRoad({ highway: 'proposed', proposed: 'secondary' })).toEqual({
      status: 'proposed',
      highway: 'secondary',
    })
  })

  it('classifies a proposed=* tag on any way', () => {
    expect(deriveRoad({ proposed: 'primary' })?.status).toBe('proposed')
  })

  it('drops non-road highways (e.g. footway)', () => {
    expect(deriveRoad({ highway: 'footway' })).toBeNull()
  })

  it('drops ways with no highway tag', () => {
    expect(deriveRoad({ building: 'yes' })).toBeNull()
  })

  it('handles missing/invalid input safely', () => {
    expect(deriveRoad(undefined)).toBeNull()
    expect(deriveRoad(null)).toBeNull()
  })
})

describe('classOf', () => {
  it('keeps known classes', () => {
    expect(classOf('tertiary')).toBe('tertiary')
  })
  it('maps unknown/empty to other', () => {
    expect(classOf('service')).toBe('other')
    expect(classOf(undefined)).toBe('other')
  })
})

describe('refOf', () => {
  it('takes the first of multi-value refs', () => {
    expect(refOf({ ref: 'NR1;AH1' })).toBe('NR1')
  })
  it('returns undefined when absent', () => {
    expect(refOf({})).toBeUndefined()
  })
})
