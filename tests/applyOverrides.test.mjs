import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyOverrides } from '../pipeline/apply-overrides.mjs'

let dir

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'apply-overrides-'))
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

function writeRoads(features) {
  const path = join(dir, 'roads.geojsonl')
  writeFileSync(path, features.map((f) => JSON.stringify(f)).join('\n') + '\n')
  return path
}

function writeOverrides(doc) {
  const path = join(dir, 'overrides.json')
  writeFileSync(path, JSON.stringify(doc))
  return path
}

function readRoads(path) {
  return readFileSync(path, 'utf8').trim().split('\n').map((line) => JSON.parse(line))
}

describe('applyOverrides', () => {
  it('applies a matching override', async () => {
    const roadsPath = writeRoads([
      { type: 'Feature', geometry: null, properties: { id: 1, status: 'built' } },
    ])
    const overridesPath = writeOverrides({ version: 1, roads: { 1: { surface: 'asphalt' } } })

    const result = await applyOverrides(roadsPath, overridesPath)

    expect(result).toEqual({ applied: 1, stale: [] })
    expect(readRoads(roadsPath)[0].properties.surface).toBe('asphalt')
  })

  it('overrides both surface and status when both are present', async () => {
    const roadsPath = writeRoads([
      { type: 'Feature', geometry: null, properties: { id: 42, surface: 'unpaved', status: 'built' } },
    ])
    const overridesPath = writeOverrides({
      version: 1,
      roads: { 42: { surface: 'concrete', status: 'under_construction' } },
    })

    await applyOverrides(roadsPath, overridesPath)

    const [feature] = readRoads(roadsPath)
    expect(feature.properties.surface).toBe('concrete')
    expect(feature.properties.status).toBe('under_construction')
  })

  it('warns and skips ids that do not match any current road', async () => {
    const roadsPath = writeRoads([
      { type: 'Feature', geometry: null, properties: { id: 1, status: 'built' } },
    ])
    const overridesPath = writeOverrides({ version: 1, roads: { 999: { surface: 'concrete' } } })

    const result = await applyOverrides(roadsPath, overridesPath)

    expect(result.applied).toBe(0)
    expect(result.stale).toEqual(['999'])
    expect(readRoads(roadsPath)[0].properties.surface).toBeUndefined()
  })

  it('is a no-op when the overrides file does not exist', async () => {
    const roadsPath = writeRoads([
      { type: 'Feature', geometry: null, properties: { id: 1, status: 'built' } },
    ])
    const missingOverridesPath = join(dir, 'does-not-exist.json')

    const result = await applyOverrides(roadsPath, missingOverridesPath)

    expect(result).toEqual({ applied: 0, stale: [] })
  })

  it('leaves unrelated roads untouched', async () => {
    const roadsPath = writeRoads([
      { type: 'Feature', geometry: null, properties: { id: 1, status: 'built', surface: 'unpaved' } },
      { type: 'Feature', geometry: null, properties: { id: 2, status: 'built', surface: 'unpaved' } },
    ])
    const overridesPath = writeOverrides({ version: 1, roads: { 1: { surface: 'asphalt' } } })

    await applyOverrides(roadsPath, overridesPath)

    const [first, second] = readRoads(roadsPath)
    expect(first.properties.surface).toBe('asphalt')
    expect(second.properties.surface).toBe('unpaved')
  })
})
