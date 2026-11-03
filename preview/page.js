/**
 * Builds the page KBF would build for one component, from KBF's own page (`vendor/page.json`).
 *
 * `vendor/page.json` is an empty page rendered by KBF itself, with the runtime inside it. This file
 * only fills in the gaps KBF leaves for a component: the title, the look, the component's host
 * element, its HTML and CSS, its script, and the instance's settings. The order the browser runs
 * things in is KBF's: runtime, then your component's script, then mount.
 */

/** JSON safe inside a `<script>` block: the same two escapes KBF applies. */
export function jsonForScript(value) {
  return JSON.stringify(value).replace(/<\//g, '<\\/').replace(/<!--/g, '\\u003c!--')
}

const escapeText = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The settings a component receives: each field's `default`, then the values given. KBF's rule. */
export function defaultsFor(schema) {
  const out = {}
  for (const [key, field] of Object.entries((schema && schema.fields) || {})) {
    if (field && field.default !== undefined && field.default !== null) out[key] = field.default
  }
  return out
}

/**
 * Settings for a first look: the defaults, plus sample words in any required text field with none,
 * so the component has something to draw. Returns the keys it filled, to say so.
 */
export function sampleConfig(schema) {
  const config = defaultsFor(schema)
  const filled = []
  for (const [key, field] of Object.entries((schema && schema.fields) || {})) {
    if (!field || !field.required || config[key] !== undefined) continue
    if (['text', 'textarea', 'richtext'].includes(field.type)) {
      config[key] = `Sample ${String(field.label || key).toLowerCase()}`
      filled.push(key)
    }
  }
  return { config, filled }
}

/** Posts the frame's script errors and console errors to the preview, before anything else runs. */
const ERROR_HOOK = `<script>
(function () {
  function tell(message) { try { parent.postMessage({ type: 'preview:error', message: String(message) }, '*'); } catch (e) {} }
  window.addEventListener('error', function (e) { tell(e.message + (e.lineno ? ' (line ' + e.lineno + ')' : '')); });
  var original = console.error;
  console.error = function () {
    tell(Array.prototype.map.call(arguments, function (a) { return a && a.stack ? a.stack : String(a); }).join(' '));
    return original.apply(console, arguments);
  };
})();
</script>`

/**
 * @param {object} kit       vendor/page.json
 * @param {object} opts
 * @param {string} opts.title
 * @param {{css: string, fonts: string}} opts.look   one look in one scheme, from kit.looks
 * @param {{html: string, css: string, js: string}} opts.files
 * @param {object} opts.config
 * @param {boolean} opts.lock     the page's Lock Next
 * @param {*} [opts.state]        saved state to resume from; `undefined` for a first visit
 */
export function buildPage(kit, { title, look, files, config, lock, state }) {
  const a = kit.anchors
  const templates = { 1: { html: files.html, css: kit.reset_css + '\n' + files.css } }
  const spec = { id: 1, tpl: '1', config, lock: !!lock }
  if (state !== undefined && state !== null) spec.state = state

  let page = kit.shell
  page = page.split(a.title).join(escapeText(title))
  page = page.replace(a.theme, () => look.css)
  page = page.replace(a.fonts, () => look.fonts + '\n' + ERROR_HOOK)
  page = page.replace(a.hosts, () => '\n    <kbf-instance data-instance="1"></kbf-instance>' + a.hosts)
  page = page.replace(a.templates, () => `KBF._templates = ${jsonForScript(templates)};`)
  // The component's script goes between the runtime and the mount, in a script tag of its own, which
  // is where KBF puts it: the block holding the mount call is closed, the script added, and reopened.
  page = page.replace(a.mount, () =>
    '</script>\n  <script>KBF._loading("1");</script>\n  <script>\n' + files.js + '\n  </script>\n  <script>\n' +
    `    KBF._mount(${jsonForScript([spec])});`)
  return page
}
