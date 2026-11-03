/**
 * `@kbf/sdk` — the component settings authoring layer.
 *
 * A component declares its settings once, here, and KBF derives everything else from it: the
 * ID's settings panel in the storyboard, the dev's panel in Course Dev, which values are answer
 * keys and must be obfuscated on export, which library category and icon the component gets, and
 * whether the player waits for an explicit completion signal before unlocking navigation.
 *
 * Before this, each of those lived in KBF core keyed by component name or field-key string:
 * `_obfuscate_answers` guessed answer fields from a hardcoded name list, the completion bridge
 * queried `.quiz-btn` and `video.player` out of the document, and `LIBRARY_CATEGORIES` plus
 * `TEMPLATE_ICONS` were frontend constants keyed by display name that had already drifted apart.
 * Adding a component meant editing KBF. Now it means writing one file.
 *
 * ## Why this is plain JavaScript with a `.d.ts` beside it
 *
 * `settings.js` has to be loadable by a bare `node` process — the CLI that compiles it to
 * `schema.json` can't depend on a TypeScript build existing first, or bootstrapping the SDK would
 * require the very toolchain the SDK is supposed to provide. So the runtime is `.js` and the types
 * come from `index.d.ts`. VS Code gives full IntelliSense either way, and there is no build step
 * for a component author to forget.
 *
 * ## The shape this emits
 *
 * A v2 schema, exactly as `frontend/src/lib/component-schema.ts` normalizes and renders it. That
 * file is the consumer half of this contract; the two must agree on field types, so a new type
 * has to be added in both places. `FIELD_TYPES` below mirrors it deliberately rather than
 * importing it — the frontend is TypeScript inside a container that can't see this directory.
 */

/** Field types the renderer implements. Must match `FIELD_TYPES` in `component-schema.ts`. */
const FIELD_TYPES = [
  'text', 'textarea', 'richtext', 'number', 'boolean', 'select',
  'color', 'url', 'asset', 'repeater', 'options', 'correct_picker',
]

/**
 * How many answer options a question may offer, as a house rule rather than a per-component
 * choice: fewer than two isn't a question, and past six the learner is reading a list instead of
 * weighing choices. A component may narrow the range, never widen it.
 */
const OPTION_COUNT = { min: 2, max: 6 }

/**
 * `single` renders the rows as a radio group — exactly one is flagged, always. `multi` renders
 * checkboxes and requires at least one. The mode is what makes "no correct answer" and "the
 * correct answer is an option that doesn't exist" unreachable rather than merely discouraged.
 */
const OPTION_MODES = ['single', 'multi']

/** Who edits a group. `dev` is the course dev in Course Dev; the ID is the course's author. */
const OWNERS = ['id', 'dev']

/**
 * `auto` fires completion as soon as the component mounts — for display-only slides with nothing
 * to finish. `explicit` waits for `kbf.complete()`, which is what `lock_next` gates on.
 */
const COMPLETION_MODES = ['auto', 'explicit']

/**
 * Kinds a `f.url({ accept })` slot may ask for. Mirrors `AssetKind` in `app/models/asset.py` minus
 * `other`, which is the store's "recognized but not one of ours" bucket and nothing should ask for.
 *
 * `caption` is separate from `video` on purpose: a slot that accepts either would let a VTT track be
 * filled with an mp4, and a video handed to a `<track>` renders an empty cue list — which reads to the
 * ID as "captions are on and there is nothing to say".
 */
const ASSET_KINDS = ['image', 'audio', 'video', 'caption']

/**
 * Field types a `ga: true` flag may sit on — the ones that hold a *design decision* rather than
 * content, so handing one to the Graphic Artist hands them nothing an ID or a dev has written.
 *
 * `accept` is the other half of the same idea and the older one: it says "Graphics supplies the
 * file here". This says "Graphics decides this here", for the settings that are consequences of
 * the picture they delivered — whether the scrim behind the text is on, which of two treatments a
 * background gets. Both are **field-level**, not group-level, deliberately: `content-slide`'s
 * `bg_image` sits in a dev-owned Design group and is exactly the slot Graphics fills, because a
 * group's `owner` is about who arranges the page, not who supplies or tunes the picture. Making
 * this a third `owner` value would also mean a group that renders in nobody's panel, since the
 * Graphic Artist has no settings panel of their own — they get these fields live inside the
 * otherwise read-only Course Dev one.
 *
 * No free text and no numbers: every type here has a closed set of legal values, so
 * `PATCH …/ga-design` can check what it is handed against the schema instead of trusting it.
 */
const GA_FIELD_TYPES = ['boolean', 'select', 'color']

class SettingsError extends Error {}

function fail(msg) {
  throw new SettingsError(msg)
}

// ── Field builders ────────────────────────────────────────────────────────────
//
// Each returns a plain object. They exist for the type hints and for rejecting a bad field at
// authoring time rather than letting it fall back to a text input at render time — which is what
// v1 did, silently, for any type the renderer didn't recognise.

const strip = obj => {
  const out = {}
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v
  return out
}

const leaf = (type, opts = {}) => strip({ ...opts, type })

export const f = {
  text:      opts => leaf('text', opts),
  textarea:  opts => leaf('textarea', opts),
  richtext:  opts => leaf('richtext', opts),
  url:       opts => leaf('url', opts),
  color:     opts => leaf('color', opts),
  number:    opts => leaf('number', opts),
  boolean:   opts => leaf('boolean', opts),
  select:    opts => leaf('select', opts),
  asset:     opts => leaf('asset', opts),

  /**
   * The legacy a/b/c/d answer picker. Prefer a `repeater` of choices with a `secret` boolean —
   * `correct_picker` stores a letter that only means anything relative to sibling field names,
   * which is the coupling that made `quiz-pool` a flat wall of `q1_a`…`q5_correct`.
   */
  correctPicker: opts => leaf('correct_picker', opts),

  /**
   * A repeating group of rows. Rows may not contain repeaters.
   *
   * Pass `answerFlag` when one of the row fields marks the correct answer — `{ field, value, mode }`,
   * where `mode: 'single'` means exactly one row must carry it and `'multi'` means at least one.
   * That's what `f.options` enforces for its own fixed row shape; a repeater has to be told which
   * of its fields is the flag, because only the component knows. Without it, a `choices` list with
   * nothing marked correct saves happily and then grades every attempt wrong.
   */
  repeater: opts => leaf('repeater', opts),

  /**
   * An answer list: 2–6 rows of `{ text, correct }`, where `correct` belongs to the row.
   *
   * A leaf rather than a repeater with a `secret` boolean inside it, even though that is exactly
   * what it behaves like, for two reasons. First, repeaters cannot nest, and `quiz-pool` needs an
   * answer list *inside* its `questions` repeater — a fixed, known row shape is what lets this sit
   * where a nested repeater can't. Second, correctness stops being something the component author
   * has to remember to flag: the type carries `secret` and the 2–6 bounds itself.
   *
   * The row's position in the list is the option's identity. Nothing stores an index or a letter,
   * so deleting a row takes its flag with it and there is no way to point at an option that isn't
   * there — the bug this type exists to make unrepresentable, where `quiz-pool` stored the answer
   * as the letter `d` while option D was blank.
   */
  options: opts => leaf('options', { mode: 'single', ...OPTION_COUNT, ...opts }),
}

// ── Validation ────────────────────────────────────────────────────────────────

function checkField(key, field, path, groupKeys, { inRepeater = false } = {}) {
  const where = `${path}${key}`
  if (!field || typeof field !== 'object') fail(`${where}: not a field object`)
  if (!FIELD_TYPES.includes(field.type)) {
    fail(`${where}: unknown type ${JSON.stringify(field.type)} (expected one of ${FIELD_TYPES.join(', ')})`)
  }
  if (typeof field.label !== 'string' || !field.label.trim()) {
    fail(`${where}: needs a non-empty label`)
  }

  // A field naming a group that doesn't exist would still render — `withUsedGroups` invents the
  // missing group — but it would land in a panel nobody expects, under a humanized key. Almost
  // always a typo, so it's an error here rather than a surprise later.
  if (!inRepeater) {
    if (typeof field.group !== 'string' || !field.group) fail(`${where}: needs a group`)
    if (!groupKeys.has(field.group)) {
      fail(`${where}: group ${JSON.stringify(field.group)} is not declared (have: ${[...groupKeys].join(', ')})`)
    }
  } else if (field.group !== undefined) {
    fail(`${where}: rows inherit the repeater's group — remove \`group\``)
  }

  // Refused rather than ignored, so a settings file written before the ruling says why it stopped
  // working: the page storyboard is notes for contributors and never reaches the course, so nothing
  // can be linked to it (Chris, 2026-10-01).
  if (field.storyboard !== undefined) {
    fail(`${where}: \`storyboard\` links are retired — the ID types this text into the setting itself`)
  }
  // Shown only while the page's Lock Next is on (2026-10-10): a "must finish this" setting does
  // nothing on an unlocked page, so the panel leaves it out there rather than offering a no-op.
  if (field.whenLocked !== undefined && typeof field.whenLocked !== 'boolean') {
    fail(`${where}: whenLocked must be true or false`)
  }
  if (field.visibleWhen !== undefined) {
    const c = field.visibleWhen
    if (!c || typeof c.field !== 'string') fail(`${where}: visibleWhen needs a \`field\``)
    if (c.eq === undefined && c.neq === undefined && c.truthy === undefined) {
      fail(`${where}: visibleWhen needs one of eq, neq or truthy`)
    }
  }

  if (field.type === 'select') {
    if (!Array.isArray(field.options) || field.options.length === 0) {
      fail(`${where}: a select needs options`)
    }
    for (const o of field.options) {
      if (typeof o !== 'string' && (typeof o !== 'object' || typeof o?.value !== 'string')) {
        fail(`${where}: each option must be a string or { value, label }`)
      }
    }
  }

  if (field.type === 'number') {
    if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
      fail(`${where}: min ${field.min} exceeds max ${field.max}`)
    }
    if (field.default !== undefined) {
      if (field.min !== undefined && field.default < field.min) fail(`${where}: default is below min`)
      if (field.max !== undefined && field.default > field.max) fail(`${where}: default is above max`)
    }
  }

  if (field.type === 'repeater') {
    if (inRepeater) fail(`${where}: repeaters cannot nest`)
    const sub = field.fields
    if (!sub || typeof sub !== 'object' || Object.keys(sub).length === 0) {
      fail(`${where}: a repeater needs at least one row field`)
    }
    if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
      fail(`${where}: min ${field.min} exceeds max ${field.max}`)
    }
    for (const [k, sf] of Object.entries(sub)) {
      checkField(k, sf, `${where}[].`, groupKeys, { inRepeater: true })
    }
    if (field.answerFlag !== undefined) {
      const a = field.answerFlag
      if (!a || typeof a !== 'object') fail(`${where}: answerFlag must be an object`)
      // A flag naming a row field that doesn't exist would count zero flagged rows forever, so
      // every save of the component would fail its own integrity check with no way to satisfy it.
      if (typeof a.field !== 'string' || !sub || !(a.field in sub)) {
        fail(`${where}: answerFlag.field must name one of this repeater's row fields`)
      }
      if (!OPTION_MODES.includes(a.mode)) {
        fail(`${where}: answerFlag.mode must be one of ${OPTION_MODES.join(', ')}`)
      }
    }
  }

  if (field.type === 'options') {
    if (!OPTION_MODES.includes(field.mode)) {
      fail(`${where}: mode must be one of ${OPTION_MODES.join(', ')}`)
    }
    // Checked rather than merely defaulted, because an author who writes `max: 8` means it and
    // should be told no, not silently given 6. The bounds are a house rule; a component may
    // narrow them (a true/false question is `max: 2`) but not widen them.
    if (!Number.isInteger(field.min) || field.min < OPTION_COUNT.min) {
      fail(`${where}: min must be an integer of at least ${OPTION_COUNT.min} — fewer isn't a question`)
    }
    if (!Number.isInteger(field.max) || field.max > OPTION_COUNT.max) {
      fail(`${where}: max must be an integer of at most ${OPTION_COUNT.max}`)
    }
    if (field.min > field.max) fail(`${where}: min ${field.min} exceeds max ${field.max}`)
    if (field.fields !== undefined) {
      fail(`${where}: an options list has a fixed row shape ({ text, correct }) — remove \`fields\``)
    }
    if (field.secret !== undefined) {
      fail(`${where}: correctness is secret by virtue of the type — remove \`secret\``)
    }
  }

  // KBF's floor is WCAG AA, so whether an image needs alt text is a decision the component author
  // has to make consciously rather than inherit from a default. `false` is a legitimate answer for
  // a purely decorative asset — it just has to be said out loud.
  if (field.type === 'asset' && typeof field.altRequired !== 'boolean') {
    fail(`${where}: an asset must declare altRequired (false only if the image is decorative)`)
  }

  // `warnWhenEmpty` carries the message itself, so a typo'd key would silently warn about nothing.
  if (field.warnWhenEmpty !== undefined
      && (typeof field.warnWhenEmpty !== 'string' || !field.warnWhenEmpty.trim())) {
    fail(`${where}: warnWhenEmpty must be the non-empty message to show when the field is blank`)
  }
  if (field.warnWhenEmpty && field.required) {
    fail(`${where}: warnWhenEmpty and required both fire on a blank value — pick one`)
  }

  // `accept` is what puts a slot on the Graphic Artist's parts list and turns its input into an asset
  // picker. A typo means a slot Graphics is never asked to fill, and the page ships with a blank where
  // an image should be — which nothing downstream can detect, because an empty optional field is
  // indistinguishable from one nobody wanted. So the value is checked against the list.
  if (field.accept !== undefined) {
    if (!ASSET_KINDS.includes(field.accept)) {
      fail(`${where}: accept must be one of ${ASSET_KINDS.join(', ')}`)
    }
    if (field.type !== 'url') {
      fail(`${where}: accept only applies to f.url (an f.asset already declares its own kind)`)
    }
  }

  // `ga: true` widens who may write this field to the Graphic Artist, so every condition here is a
  // bound on a permission rather than a convenience. A typo in the flag name fails as an unknown
  // key; a flag on the wrong kind of field fails here, loudly, because the alternative is a route
  // that accepts a value it cannot check.
  if (field.ga !== undefined) {
    if (typeof field.ga !== 'boolean') fail(`${where}: ga must be a boolean`)
    if (field.ga) {
      if (!GA_FIELD_TYPES.includes(field.type)) {
        fail(`${where}: ga only applies to ${GA_FIELD_TYPES.join(', ')} — a field Graphics may set `
          + 'must have a closed set of legal values, so the server can check what it is handed. For '
          + 'a media file use `accept` instead.')
      }
      // Belt and braces: `secret` on one of these three types is already nothing the library does,
      // and the server's whitelist skips it too. Refusing here means the two cannot drift into
      // disagreeing about a field that holds an answer key.
      if (field.secret) fail(`${where}: a secret field is never Graphics' to set — remove \`ga\``)
      // The protocol carries a field key and no row index, exactly as `accept` inside a repeater
      // cannot be addressed. Failing at authoring time beats a control that 422s every save.
      if (inRepeater) fail(`${where}: ga cannot address a row inside a repeater`)
    }
  }
}

/**
 * Validate a settings declaration and return the v2 schema JSON to store in
 * `ComponentTemplate.schema`.
 *
 * Throws on anything malformed. That's deliberate and it's the point: a schema that reaches the
 * database is one the renderer, the exporter and the obfuscator all have to cope with, and v1's
 * "unknown type falls back to text" behaviour meant a typo produced a working-looking panel that
 * quietly dropped the author's intent.
 */
export function defineSettings(spec) {
  if (!spec || typeof spec !== 'object') fail('defineSettings needs an object')

  const { category, icon, completion = 'explicit', scored, styleTokens, groups, fields, theme } = spec

  const known = new Set([
    'category', 'icon', 'completion', 'scored', 'styleTokens', 'groups', 'fields', 'theme',
  ])
  for (const k of Object.keys(spec)) {
    if (!known.has(k)) fail(`unknown top-level key ${JSON.stringify(k)}`)
  }

  if (typeof category !== 'string' || !category.trim()) {
    fail('category is required — it places the component in the library')
  }
  if (typeof icon !== 'string' || !icon.trim()) {
    fail('icon is required — it names the library card icon')
  }
  if (!COMPLETION_MODES.includes(completion)) {
    fail(`completion must be one of ${COMPLETION_MODES.join(', ')}`)
  }

  // `scored: true` means this component decides the module's SCORM mark and gates its completion:
  // nothing is reported to the LMS until every scoring instance reports a pass, and the mark is the
  // percentage they scored. Leave it off for anything formative — a knowledge check may grade and
  // give feedback all it likes, and still contribute nothing to the record.
  //
  // Deliberately not a settings field: it is a property of the component, not something an ID
  // chooses per placement. What an ID can choose is `exclude_from_score`, which turns it off.
  if (scored !== undefined && typeof scored !== 'boolean') fail('scored must be a boolean')

  if (!Array.isArray(groups) || groups.length === 0) fail('groups must be a non-empty array')
  const groupKeys = new Set()
  groups.forEach((g, i) => {
    if (!g || typeof g.key !== 'string' || !g.key) fail(`groups[${i}]: needs a key`)
    if (groupKeys.has(g.key)) fail(`groups[${i}]: duplicate key ${JSON.stringify(g.key)}`)
    if (typeof g.label !== 'string' || !g.label.trim()) fail(`groups[${i}]: needs a label`)
    if (!OWNERS.includes(g.owner)) {
      fail(`groups[${i}]: owner must be one of ${OWNERS.join(', ')}`)
    }
    groupKeys.add(g.key)
  })

  if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
    fail('fields must be a non-empty object')
  }
  for (const [key, field] of Object.entries(fields)) {
    if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      fail(`fields.${key}: keys must be lower_snake_case — they are config keys components read`)
    }
    checkField(key, field, 'fields.', groupKeys)
  }

  // `optional` and `altField` describe a media slot to Graphics, so they mean nothing anywhere else.
  // `optional: true` keeps an empty slot off the parts list until somebody asks for it. `altField`
  // names the text setting that describes the picture: the ID's brief, and the alt text a learner
  // hears unless Graphics marks the image decorative (Chris, 2026-10-02).
  for (const [key, field] of Object.entries(fields)) {
    const media = typeof field.accept === 'string' || field.type === 'asset'
    if (field.optional !== undefined) {
      if (typeof field.optional !== 'boolean') fail(`fields.${key}: optional must be a boolean`)
      if (!media) fail(`fields.${key}: optional is only for media slots (fields with accept)`)
    }
    if (field.altField !== undefined) {
      if (field.accept !== 'image') fail(`fields.${key}: altField is only for image slots`)
      const alt = fields[field.altField]
      if (!alt) fail(`fields.${key}: altField names ${JSON.stringify(field.altField)}, which is not a field`)
      if (alt.type !== 'text' && alt.type !== 'textarea') {
        fail(`fields.${key}: altField ${JSON.stringify(field.altField)} must be a text or textarea field`)
      }
      if (alt.secret) fail(`fields.${key}: altField ${JSON.stringify(field.altField)} cannot be secret`)
    }
    // The size Graphics should supply (Chris, 2026-10-11): `{ width, height?, crop?, note? }` in pixels,
    // at twice the largest size the component draws it. Shown beside the slot and on the parts list,
    // and an image smaller, or of another shape where `crop` is set, is warned about, never refused.
    if (field.size !== undefined) {
      const s = field.size
      if (field.accept !== 'image') fail(`fields.${key}: size is only for image slots`)
      if (!s || typeof s !== 'object') fail(`fields.${key}: size must be { width, height?, crop?, note? }`)
      const px = v => Number.isInteger(v) && v > 0
      if (!px(s.width)) fail(`fields.${key}: size.width must be a positive whole number of pixels`)
      if (s.height !== undefined && !px(s.height)) fail(`fields.${key}: size.height must be a positive whole number of pixels`)
      if (s.crop !== undefined && typeof s.crop !== 'boolean') fail(`fields.${key}: size.crop must be a boolean`)
      if (s.crop && s.height === undefined) fail(`fields.${key}: size.crop needs a height, since cropping is to a shape`)
      if (s.note !== undefined && (typeof s.note !== 'string' || !s.note.trim())) fail(`fields.${key}: size.note must be a non-empty string`)
      const extra = Object.keys(s).filter(k => !['width', 'height', 'crop', 'note'].includes(k))
      if (extra.length) fail(`fields.${key}: size has unknown key(s) ${extra.join(', ')}`)
    }
  }

  // Every declared group should own at least one field. An empty group renders as an empty
  // panel section, which reads as a bug to the ID looking at it.
  const used = new Set(Object.values(fields).map(fl => fl.group))
  for (const g of groups) {
    if (!used.has(g.key)) fail(`group ${JSON.stringify(g.key)} has no fields`)
  }

  if (styleTokens !== undefined) {
    if (!Array.isArray(styleTokens)) fail('styleTokens must be an array')
    for (const t of styleTokens) {
      if (typeof t !== 'string' || !t.startsWith('--kbf-')) {
        fail(`styleTokens: ${JSON.stringify(t)} must be a --kbf-* custom property`)
      }
    }
  }

  if (theme !== undefined) {
    if (!theme || typeof theme !== 'object') fail('theme must be an object')
    for (const [k, t] of Object.entries(theme)) {
      if (typeof t?.token !== 'string' || !t.token.startsWith('--kbf-')) {
        fail(`theme.${k}: token must be a --kbf-* custom property`)
      }
      if (typeof t.label !== 'string' || !t.label.trim()) fail(`theme.${k}: needs a label`)
    }
  }

  return strip({
    version: 2,
    category,
    icon,
    completion,
    scored,
    styleTokens,
    groups,
    fields: numbered(fields),
    theme,
  })
}

/**
 * Every field, and every repeater's row fields, stamped with `order` — its position as declared here.
 *
 * The settings panel lists fields in key order, and the library stores the schema as JSONB, which
 * keeps no key order of its own: Postgres sorts keys shortest first, so Content Slide's `body` came
 * back ahead of its `heading`. An explicit `order` survives the round trip. One already set is kept.
 */
function numbered(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, field], i) => {
    const out = { ...field }
    if (out.order === undefined) out.order = i
    if (out.type === 'repeater' && out.fields) out.fields = numbered(out.fields)
    return [key, out]
  }))
}

export {
  FIELD_TYPES,
  OWNERS,
  COMPLETION_MODES,
  OPTION_COUNT,
  OPTION_MODES,
  SettingsError,
}
