#!/usr/bin/env node
/**
 * Compile every component's `settings.js` into the `schema.json` that KBF actually stores.
 *
 *   node backend/bin/kbf-settings.mjs           # write schema.json for every settings.js
 *   node backend/bin/kbf-settings.mjs --check    # exit 1 if any is stale; writes nothing
 *   node backend/bin/kbf-settings.mjs --only quiz-pool
 *
 * ## Why there are two files instead of one
 *
 * `settings.js` is the source an author edits; `schema.json` is the compiled artifact everything
 * else reads. Both are committed, which is a duplication and therefore a drift risk, so `--check`
 * exists and a test runs it.
 *
 * The alternative — have the backend read `settings.js` directly — isn't available: there is no
 * node in the backend container, and `seed.py` loads schemas off disk at import time. Compiling to
 * JSON keeps the backend a pure Python consumer and keeps `seed.py` untouched. The plan assumed
 * Python could evaluate the JS; it can't.
 *
 * Compiling is also the only place a bad schema can be caught before it reaches the database.
 * `defineSettings` throws, so a malformed field fails here rather than rendering as a silent text
 * input the way v1 did.
 *
 * ## The lockfile
 *
 * Every run also writes `_sdk/compiled.lock`: the SHA-256 of each `settings.js` and of the
 * `schema.json` it produced. `--check` verifies it, and so does a pytest — which matters because
 * the two halves of this repo can't run each other's tools. There is no node in the backend
 * container and no pytest on the host, so a test that shelled out to this script would skip
 * forever and guard nothing. Hashes are the one thing both languages can compare.
 *
 * What the lock proves: the compiler last ran on exactly these inputs and produced exactly these
 * outputs. So editing `settings.js` without recompiling fails, and hand-editing a `schema.json`
 * fails too. What it does not prove is that the output is *correct* for the input — only node can
 * check that, by running this script.
 */

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const COMPONENTS = resolve(HERE, '..', 'components')
const LOCK = join(COMPONENTS, '_sdk', 'compiled.lock')

const sha = text => createHash('sha256').update(text, 'utf8').digest('hex')

const argv = process.argv.slice(2)
const CHECK = argv.includes('--check')
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null

/** Stable, diff-friendly JSON. Two spaces and a trailing newline, matching the existing files. */
function serialize(schema) {
  return JSON.stringify(schema, null, 2) + '\n'
}

async function compile(dir) {
  const settingsPath = join(COMPONENTS, dir, 'settings.js')
  // Cache-bust so a watch loop picks up edits; harmless on a one-shot run.
  const mod = await import(`${pathToFileURL(settingsPath).href}?t=${Date.now()}`)
  const schema = mod.default
  if (!schema || typeof schema !== 'object' || schema.version !== 2) {
    throw new Error('settings.js must `export default defineSettings({...})`')
  }
  return serialize(schema)
}

function readIfPresent(path) {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}

const entries = (await readdir(COMPONENTS, { withFileTypes: true }))
  .filter(e => e.isDirectory() && !e.name.startsWith('_'))
  .map(e => e.name)
  .filter(name => !only || name === only)
  .sort()

// `--only` must not drop every other component from the lock, so start from what's there.
const lock = JSON.parse(readIfPresent(LOCK) ?? '{}')

let written = 0
let stale = 0
let skipped = 0
const failures = []

for (const name of entries) {
  const settingsPath = join(COMPONENTS, name, 'settings.js')
  const settings = readIfPresent(settingsPath)
  if (settings === null) {
    // Not yet converted. Components migrate one at a time — `normalizeSchema` reads v1 too — so
    // an unconverted directory is expected, not an error.
    skipped++
    delete lock[name]
    continue
  }

  let next
  try {
    next = await compile(name)
  } catch (err) {
    failures.push(`${name}: ${err.message}`)
    continue
  }

  const schemaPath = join(COMPONENTS, name, 'schema.json')
  const current = readIfPresent(schemaPath)

  if (current !== next) {
    if (CHECK) {
      stale++
      console.error(
        current === null
          ? `  ${name}: schema.json is missing`
          : `  ${name}: schema.json is stale`,
      )
      continue
    }
    writeFileSync(schemaPath, next)
    written++
    console.log(`  ${name}: ${current === null ? 'created' : 'updated'} schema.json`)
  }

  lock[name] = { settings: sha(settings), schema: sha(next) }
}

if (failures.length) {
  console.error(`\n${failures.length} settings file(s) failed to compile:`)
  for (const line of failures) console.error(`  ${line}`)
  process.exit(1)
}

/** Sorted so the lock produces a stable diff regardless of directory read order. */
function serializeLock(obj) {
  const sorted = {}
  for (const k of Object.keys(obj).sort()) sorted[k] = obj[k]
  return JSON.stringify(sorted, null, 2) + '\n'
}

const nextLock = serializeLock(lock)

if (CHECK) {
  if (nextLock !== readIfPresent(LOCK)) {
    console.error('  compiled.lock does not match the files on disk')
    stale++
  }
  if (stale) {
    console.error(
      `\n${stale} problem(s). Run: node backend/bin/kbf-settings.mjs`,
    )
    process.exit(1)
  }
  console.log(`schemas up to date (${entries.length - skipped} compiled, ${skipped} still v1)`)
} else {
  writeFileSync(LOCK, nextLock)
  console.log(
    `\n${written} written, ${entries.length - skipped - written} already current, ${skipped} still v1`,
  )
}
