// The preview harness: picks a component, builds its page with page.js, and reports what the
// component tells KBF. Nothing here is part of a course.
import { buildPage, sampleConfig } from './page.js'

const $ = id => document.getElementById(id)
const els = {
  component: $('component'), warning: $('component-warning'), look: $('look'), size: $('size'),
  lock: $('lock'), fresh: $('fresh'), resume: $('resume'), axe: $('axe'), axeResult: $('axe-result'),
  stage: $('stage'), frame: $('frame'), next: $('next'), lockStatus: $('lock-status'),
  config: $('config'), configError: $('config-error'), apply: $('apply'), defaults: $('defaults'),
  log: $('log'), clearLog: $('clear-log'),
}

let kit = null            // vendor/page.json
let list = []             // /api/components
let current = null        // { id, schema, files, meta, changed }
let savedState = null     // what the component last passed to kbf.state.save()
let pageComplete = false

const store = {
  get: (key, fallback) => { try { const v = localStorage.getItem('kbf-preview:' + key); return v === null ? fallback : JSON.parse(v) } catch { return fallback } },
  set: (key, value) => { try { localStorage.setItem('kbf-preview:' + key, JSON.stringify(value)) } catch { /* private mode */ } },
}

function log(kind, text, data) {
  const li = document.createElement('li')
  li.className = 'log-' + kind
  const time = new Date().toLocaleTimeString()
  const head = document.createElement('span')
  head.className = 'log-head'
  head.textContent = `${time}  ${text}`
  li.appendChild(head)
  if (data !== undefined) {
    const pre = document.createElement('pre')
    pre.textContent = JSON.stringify(data, null, 2)
    li.appendChild(pre)
  }
  els.log.prepend(li)
}

async function getText(url) {
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error(`${url}: ${r.status} ${await r.text()}`)
  return r.text()
}

// ── Loading ─────────────────────────────────────────────────────────────────────────────────────
async function loadKit() {
  try {
    kit = JSON.parse(await getText('vendor/page.json'))
  } catch (e) {
    els.warning.hidden = false
    els.warning.textContent = 'preview/vendor/page.json is missing, so no page can be built. It comes with the repo; ask the KBF team for a fresh copy.'
    throw e
  }
  for (const [slug, look] of Object.entries(kit.looks)) {
    const o = document.createElement('option')
    o.value = slug
    o.textContent = look.label
    els.look.appendChild(o)
  }
  els.look.value = store.get('look', 'kb4')
  document.querySelector(`input[name=scheme][value="${store.get('scheme', 'light')}"]`).checked = true
  els.size.value = store.get('size', '1000x596')
  els.lock.checked = store.get('lock', true)
}

async function loadList() {
  const fresh = JSON.parse(await getText('/api/components'))
  const label = c => `${c.id} ${c.name} ${c.version}`
  const same = fresh.length === list.length && fresh.every((c, i) => label(c) === label(list[i]))
  list = fresh
  // Rebuilt only when the folders change, so the once-a-second check never disturbs the menu.
  if (same && els.component.options.length) return
  const selected = els.component.value || store.get('component', 'starter')
  els.component.replaceChildren(...list.map(c => {
    const o = document.createElement('option')
    o.value = c.id
    o.textContent = `${c.name}${c.version ? ' ' + c.version : ''}  (${c.id})`
    return o
  }))
  if (list.some(c => c.id === selected)) els.component.value = selected
}

async function loadComponent(id) {
  const info = list.find(c => c.id === id)
  const base = `/c/${encodeURIComponent(id)}/`
  const [meta, schema, html, css, js] = await Promise.all([
    getText(base + 'component.json').then(JSON.parse),
    getText(base + 'schema.json').then(JSON.parse).catch(() => ({ fields: {} })),
    getText(base + 'component.html'), getText(base + 'component.css'), getText(base + 'component.js'),
  ])
  current = { id, meta, schema, files: { html, css, js }, changed: info ? info.changed : 0 }
  const problems = []
  if (info && info.stale) problems.push('schema.json is out of date with settings.js. Run `node bin/kbf-settings.mjs --only ' + id + '` so KBF gets the settings you wrote.')
  if (info && info.missing.length) problems.push('Missing: ' + info.missing.join(', ') + '.')
  els.warning.hidden = !problems.length
  els.warning.textContent = problems.join(' ')

  const stored = store.get('config:' + id, null)
  const { config, filled } = sampleConfig(schema)
  // Defaults first, then what you typed: KBF's order, so a field added to settings.js since you last
  // edited here still arrives with its default.
  els.config.value = JSON.stringify(stored ? { ...config, ...stored } : config, null, 2)
  if (!stored && filled.length) log('info', `Sample words put in the required field(s) ${filled.join(', ')}, which have no default.`)
  savedState = store.get('state:' + id, null)
}

// ── Building the page ───────────────────────────────────────────────────────────────────────────
function readConfig() {
  try {
    const value = JSON.parse(els.config.value || '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Settings must be a JSON object, { … }.')
    els.configError.hidden = true
    return value
  } catch (e) {
    els.configError.hidden = false
    els.configError.textContent = 'Settings are not valid JSON: ' + e.message
    return null
  }
}

function render({ resume }) {
  if (!kit || !current) return
  const config = readConfig()
  if (!config) return
  const scheme = document.querySelector('input[name=scheme]:checked').value
  const look = kit.looks[els.look.value][scheme]
  const [w, h] = els.size.value.split('x').map(Number)
  els.stage.style.width = w + 'px'
  els.stage.style.height = h + 'px'

  // `schema.completion` is what KBF stores; the define() call's own option is what the runtime reads.
  const declared = current.schema.completion
  const inCode = /KBF\.define\(\s*\{[^}]*completion\s*:\s*['"](auto|explicit)['"]/.exec(current.files.js)
  if (declared && inCode && inCode[1] !== declared) {
    log('error', `settings.js says completion '${declared}' but component.js says '${inCode[1]}'. Make them match.`)
  }

  pageComplete = false
  updateLock()
  const state = resume ? savedState : undefined
  els.frame.srcdoc = buildPage(kit, {
    title: current.meta.name || current.id, look, files: current.files, config, lock: els.lock.checked, state,
  })
  els.axeResult.replaceChildren()
  log('info', resume
    ? (savedState ? 'Reloaded as a resume, with the saved state.' : 'Reloaded as a resume, but nothing was saved, so this is a first visit.')
    : 'Started fresh.', resume && savedState ? savedState : undefined)
}

function updateLock() {
  const locked = els.lock.checked && !pageComplete
  els.next.disabled = locked
  els.lockStatus.textContent = !els.lock.checked ? 'Lock Next is off'
    : pageComplete ? 'Complete: Next is open' : 'Next is locked until the component completes'
}

// ── What the component tells KBF ────────────────────────────────────────────────────────────────
window.addEventListener('message', e => {
  if (e.source !== els.frame.contentWindow || !e.data || typeof e.data.type !== 'string') return
  const d = e.data
  switch (d.type) {
    case 'kbf:page-ready': log('quiet', 'Page mounted.'); break
    case 'kbf:instance-complete': log('good', 'kbf.complete(): the component says the learner has finished it.'); break
    case 'kbf:complete': pageComplete = true; updateLock(); log('good', 'Page complete: KBF would open Next now.'); break
    case 'kbf:state':
      savedState = d.data
      if (current) store.set('state:' + current.id, savedState)
      log('info', 'kbf.state.save(): saved for a resume.', d.data)
      if (JSON.stringify(d.data || null).length > 2000) log('error', 'That state is over 2,000 characters. It travels in the learner\'s saved progress, which is small; save less.')
      break
    case 'kbf:score': log('info', 'kbf.quiz.score()', { correct: d.correct, total: d.total, passed: d.passed }); break
    case 'kbf:interaction': log('info', 'kbf.quiz.answered()', d); break
    case 'kbf:glossary': log('info', `kbf.glossary.show('${d.term}')`); break
    case 'kbf:terminate': log('info', 'kbf.terminate()'); break
    case 'preview:error': log('error', 'Error in the component: ' + d.message); break
  }
})

// ── Accessibility check ─────────────────────────────────────────────────────────────────────────
async function runAxe() {
  const win = els.frame.contentWindow
  const doc = els.frame.contentDocument
  els.axeResult.textContent = 'Checking…'
  if (!win.axe) {
    try {
      await new Promise((resolve, reject) => {
        const s = doc.createElement('script')
        s.src = new URL('vendor/axe.min.js', location.href).href
        s.onload = resolve
        s.onerror = () => reject(new Error('vendor/axe.min.js is not in this preview.'))
        doc.head.appendChild(s)
      })
    } catch (e) {
      els.axeResult.textContent = e.message
      return
    }
  }
  const result = await win.axe.run(doc, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })
  const out = []
  const head = document.createElement('p')
  head.className = result.violations.length ? 'warning' : 'good'
  head.textContent = result.violations.length
    ? `${result.violations.length} problem(s) to fix. QA will find these too.`
    : 'No problems axe can prove. It cannot check everything: try the keyboard and a screen reader too.'
  out.push(head)
  const add = (items, title) => {
    if (!items.length) return
    const h = document.createElement('h3')
    h.textContent = title
    const ul = document.createElement('ul')
    for (const v of items) {
      const li = document.createElement('li')
      const a = document.createElement('a')
      a.href = v.helpUrl
      a.target = '_blank'
      a.rel = 'noreferrer'
      a.textContent = v.help
      li.append(a, ` (${v.nodes.length} place${v.nodes.length === 1 ? '' : 's'}): `)
      const code = document.createElement('code')
      code.textContent = v.nodes.map(n => [].concat(n.target).join(' ')).slice(0, 3).join(', ')
      li.appendChild(code)
      ul.appendChild(li)
    }
    out.push(h, ul)
  }
  add(result.violations, 'Problems')
  add(result.incomplete, 'For you to check by eye (axe could not decide)')
  els.axeResult.replaceChildren(...out)
}

// ── Wiring ──────────────────────────────────────────────────────────────────────────────────────
els.component.addEventListener('change', async () => {
  store.set('component', els.component.value)
  await loadComponent(els.component.value)
  render({ resume: false })
})
els.look.addEventListener('change', () => { store.set('look', els.look.value); render({ resume: false }) })
document.querySelectorAll('input[name=scheme]').forEach(r => r.addEventListener('change', () => {
  store.set('scheme', r.value); render({ resume: false })
}))
els.size.addEventListener('change', () => { store.set('size', els.size.value); render({ resume: false }) })
els.lock.addEventListener('change', () => { store.set('lock', els.lock.checked); render({ resume: false }) })
els.fresh.addEventListener('click', () => render({ resume: false }))
els.resume.addEventListener('click', () => render({ resume: true }))
els.axe.addEventListener('click', runAxe)
els.next.addEventListener('click', () => log('quiet', 'Next pressed. (There is no next page in the preview.)'))
els.apply.addEventListener('click', () => {
  const config = readConfig()
  if (!config) return
  store.set('config:' + current.id, config)
  render({ resume: false })
})
els.defaults.addEventListener('click', () => {
  localStorage.removeItem('kbf-preview:config:' + current.id)
  els.config.value = JSON.stringify(sampleConfig(current.schema).config, null, 2)
  render({ resume: false })
})
els.clearLog.addEventListener('click', () => els.log.replaceChildren())

// Rebuild when a component file is saved.
async function watch() {
  try {
    const before = current && list.find(c => c.id === current.id)
    await loadList()
    const after = current && list.find(c => c.id === current.id)
    if (before && after && after.changed !== before.changed) {
      await loadComponent(current.id)
      log('quiet', 'A file changed; rebuilt.')
      render({ resume: false })
    }
  } catch { /* the server stopped; try again next tick */ }
  setTimeout(watch, 1000)
}

await loadKit()
await loadList()
if (list.length) {
  await loadComponent(els.component.value)
  render({ resume: false })
} else {
  els.warning.hidden = false
  els.warning.textContent = 'No component folders found. A component folder holds a component.json.'
}
watch()
