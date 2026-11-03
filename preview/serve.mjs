#!/usr/bin/env node
/**
 * The KBF component preview: run your component the way KBF will, on your own machine.
 *
 *   node preview/serve.mjs                 # then open http://localhost:4173
 *   node preview/serve.mjs --port 5000
 *
 * No packages to install. It serves this folder and your component files, and nothing else, to this
 * machine only (127.0.0.1). The page it serves rebuilds your component whenever you save a file.
 *
 * Options, for running it from somewhere other than the repo root:
 *   --components DIR   where component folders live (default: ../components, beside preview/)
 *   --starter DIR      the starter component (default: ../starter)
 */
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const opt = (name, fallback) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback)

const PORT = Number(opt('--port', 4173))
const COMPONENTS = resolve(opt('--components', join(HERE, '..', 'components')))
const STARTER = resolve(opt('--starter', join(HERE, '..', 'starter')))

/** The files that make up a component. Only these are served from a component folder. */
const FILES = ['component.json', 'settings.js', 'schema.json', 'component.html', 'component.css', 'component.js']

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.vtt': 'text/vtt; charset=utf-8',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg',
}

/** Every component folder: `starter` first, then each folder in components/ holding a component.json. */
function folders() {
  const out = []
  if (existsSync(join(STARTER, 'component.json'))) out.push({ id: 'starter', dir: STARTER })
  if (existsSync(COMPONENTS)) {
    for (const entry of readdirSync(COMPONENTS, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name.startsWith('.')) continue
      const dir = join(COMPONENTS, entry.name)
      if (existsSync(join(dir, 'component.json'))) out.push({ id: entry.name, dir })
    }
  }
  return out
}

const mtime = path => (existsSync(path) ? statSync(path).mtimeMs : 0)
const sha = path => createHash('sha256').update(readFileSync(path, 'utf8'), 'utf8').digest('hex')

/**
 * Whether schema.json is out of date with settings.js. The compiler records both files' fingerprints
 * in `_sdk/compiled.lock` each time it runs, so a mismatch means settings.js changed since (or
 * schema.json was edited by hand). File times can't tell: a fresh clone gives every file the same one.
 */
function isStale(id, dir) {
  const settings = join(dir, 'settings.js'), schema = join(dir, 'schema.json')
  if (!existsSync(settings)) return false
  if (!existsSync(schema)) return true
  let lock = {}
  try { lock = JSON.parse(readFileSync(join(COMPONENTS, '_sdk', 'compiled.lock'), 'utf8')) } catch { /* none yet */ }
  const entry = lock[id]
  if (!entry) return id !== 'starter'   // never compiled; the starter ships compiled and outside components/
  return entry.settings !== sha(settings) || entry.schema !== sha(schema)
}

function describe({ id, dir }) {
  let meta = {}
  try { meta = JSON.parse(readFileSync(join(dir, 'component.json'), 'utf8')) } catch { /* reported below */ }
  const changed = Math.max(...FILES.map(f => mtime(join(dir, f))))
  return {
    id,
    name: meta.name || id,
    version: meta.version || '',
    changed,
    // settings.js saved after schema.json: the settings panel KBF would show is out of date.
    stale: isStale(id, dir),
    missing: FILES.filter(f => f !== 'settings.js' && !existsSync(join(dir, f))),
  }
}

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' })
  res.end(body)
}

/** A file under `root`, refusing any path that climbs out of it. */
function fileUnder(root, rel) {
  const path = resolve(root, '.' + sep + rel)
  if (path !== root && !path.startsWith(root + sep)) return null
  return existsSync(path) && statSync(path).isFile() ? path : null
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const path = decodeURIComponent(url.pathname)
  if (req.method !== 'GET') return send(res, 405, 'Only GET')

  if (path === '/api/components') {
    return send(res, 200, JSON.stringify(folders().map(describe)), TYPES['.json'])
  }
  // /c/<id>/<file>: one of a component's own files.
  const m = /^\/c\/([^/]+)\/([^/]+)$/.exec(path)
  if (m) {
    const found = folders().find(f => f.id === m[1])
    if (!found || !FILES.includes(m[2])) return send(res, 404, 'Not a component file')
    const file = join(found.dir, m[2])
    if (!existsSync(file)) return send(res, 404, `${m[1]} has no ${m[2]}`)
    return send(res, 200, readFileSync(file), TYPES[extname(file)])
  }
  // Anything else: this folder (the harness, vendor/, samples/).
  const file = fileUnder(HERE, path === '/' ? 'index.html' : path.slice(1))
  if (!file || file.endsWith('.mjs')) return send(res, 404, 'Not found')
  return send(res, 200, readFileSync(file), TYPES[extname(file)] || 'application/octet-stream')
}).listen(PORT, '127.0.0.1', () => {
  if (!existsSync(join(HERE, 'vendor', 'page.json'))) {
    console.warn('  ! preview/vendor/page.json is missing; the preview cannot build a page without it.')
  }
  console.log(`  KBF component preview: http://localhost:${PORT}`)
  console.log(`  components from ${COMPONENTS}`)
})
