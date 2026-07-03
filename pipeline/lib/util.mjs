import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
export const ROOT = resolve(here, '..', '..')
export const WORK = resolve(ROOT, 'pipeline', '.work')
export const OUT_DATA = resolve(ROOT, 'public', 'data')

export function ensureDirs() {
  for (const d of [WORK, OUT_DATA]) {
    if (!existsSync(d)) mkdirSync(d, { recursive: true })
  }
}

/** Run a command, inheriting stdio; throws on non-zero exit. */
export function run(cmd, args, opts = {}) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`)
  const res = spawnSync(cmd, args, { stdio: 'inherit', ...opts })
  if (res.status !== 0) {
    throw new Error(`Command failed (${res.status}): ${cmd} ${args.join(' ')}`)
  }
}

/** Verify an external CLI tool exists, with an install hint if not. */
export function ensureTool(bin, hint) {
  const res = spawnSync(bin, ['--version'], { stdio: 'ignore' })
  if (res.error) {
    throw new Error(`Missing required tool: "${bin}".\n  Install: ${hint}`)
  }
}

/** Download a URL to a destination path using curl (resumable, follows redirects). */
export function download(url, dest) {
  if (existsSync(dest)) {
    console.log(`✓ cached: ${dest}`)
    return
  }
  run('curl', ['-L', '--fail', '--retry', '3', '-o', dest, url])
}

export function isoToday() {
  return new Date().toISOString()
}
