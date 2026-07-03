const PMTILES_CONTENT_TYPE = 'application/vnd.pmtiles'
const RANGE_PATTERN = /^bytes=(\d*)-(\d*)$/

export default defineEventHandler(async (event) => {
  const data = await useStorage('assets:pmtiles').getItemRaw('cambodia.pmtiles')
  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data)
  const size = buffer.length
  const range = getHeader(event, 'range')

  setHeader(event, 'accept-ranges', 'bytes')
  setHeader(event, 'content-type', PMTILES_CONTENT_TYPE)

  if (!range) {
    setHeader(event, 'content-length', size)
    return buffer
  }

  const requestedRange = parseRange(range, size)
  if (!requestedRange) {
    setResponseStatus(event, 416)
    setHeader(event, 'content-range', `bytes */${size}`)
    return ''
  }

  const { start, end } = requestedRange

  setResponseStatus(event, 206)
  setHeader(event, 'content-length', end - start + 1)
  setHeader(event, 'content-range', `bytes ${start}-${end}/${size}`)

  return buffer.subarray(start, end + 1)
})

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
