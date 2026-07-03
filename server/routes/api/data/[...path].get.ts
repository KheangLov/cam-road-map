import { createReadStream, statSync } from 'node:fs'
import { join, normalize, sep } from 'node:path'

const PUBLIC_DATA_DIR = join(process.cwd(), 'public', 'data')
const PMTILES_CONTENT_TYPE = 'application/vnd.pmtiles'
const RANGE_PATTERN = /^bytes=(\d*)-(\d*)$/

export default defineEventHandler((event) => {
  const pathParam = getRouterParam(event, 'path')
  const relativePath = Array.isArray(pathParam) ? pathParam.join('/') : pathParam

  if (!relativePath || !relativePath.endsWith('.pmtiles')) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const filePath = resolveDataPath(relativePath)
  const size = statSync(filePath).size
  const range = getHeader(event, 'range')

  setHeader(event, 'accept-ranges', 'bytes')
  setHeader(event, 'content-type', PMTILES_CONTENT_TYPE)

  if (!range) {
    setHeader(event, 'content-length', String(size))
    return sendStream(event, createReadStream(filePath))
  }

  const requestedRange = parseRange(range, size)
  if (!requestedRange) {
    setResponseStatus(event, 416)
    setHeader(event, 'content-range', `bytes */${size}`)
    return ''
  }

  const { start, end } = requestedRange
  const contentLength = end - start + 1

  setResponseStatus(event, 206)
  setHeader(event, 'content-length', String(contentLength))
  setHeader(event, 'content-range', `bytes ${start}-${end}/${size}`)

  return sendStream(event, createReadStream(filePath, { start, end }))
})

function resolveDataPath(relativePath: string) {
  const normalizedPath = normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '')
  const filePath = join(PUBLIC_DATA_DIR, normalizedPath)

  if (!filePath.startsWith(`${PUBLIC_DATA_DIR}${sep}`)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid data path' })
  }

  return filePath
}

function parseRange(range: string, size: number) {
  const match = RANGE_PATTERN.exec(range.trim())
  if (!match) return null

  const [, rawStart, rawEnd] = match
  const start = rawStart ? Number(rawStart) : 0
  const end = rawEnd ? Number(rawEnd) : size - 1

  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || start >= size) {
    return null
  }

  return { start, end: Math.min(end, size - 1) }
}
