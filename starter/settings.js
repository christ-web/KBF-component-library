// Reveal Card: the KBF starter component.
//
// This file declares the settings panel KBF shows for your component: which fields exist, who fills
// each one in, and what kind of value each holds. KBF stores the compiled version, `schema.json`.
// After any edit here, run from the repo root:
//
//     node bin/kbf-settings.mjs --only <your-folder-name>
//
// and commit both files. The compiler refuses a malformed field with a message naming it.
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  // Where it sits in KBF's component library.
  category: 'Interactives',   // one of: Text, Slides & Layout, Media, Interactives, Quiz & Assessment
  icon: 'eye',

  // 'explicit': this component tells KBF when the learner is done, by calling `kbf.complete()`.
  // 'auto' is for display-only components with nothing to finish; they complete as soon as they show.
  // It matters when the page has Lock Next on: the learner can't move on until every locked
  // component on the page has completed.
  completion: 'explicit',

  // The design tokens component.css reads. KBF uses this list to show Graphics and QA which colours
  // a component depends on.
  styleTokens: [
    '--kbf-color-surface', '--kbf-color-text', '--kbf-color-heading',
    '--kbf-color-border', '--kbf-radius-lg', '--kbf-type-heading-m', '--kbf-type-body',
  ],

  // Groups split the panel by who owns the fields in it.
  //   owner 'id':  the Instructional Designer writes these (the course's words).
  //   owner 'dev': the course developer sets these when building the page.
  // A field marked `ga: true` is the Graphic Artist's, whatever its group.
  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
    { key: 'setup', label: 'Setup', owner: 'dev', order: 1 },
  ],

  fields: {
    // ── The ID's words ─────────────────────────────────────────────────────────────────────
    heading: f.text({ label: 'Heading', group: 'content', required: true, maxLength: 120 }),
    intro: f.textarea({ label: 'Intro text', group: 'content', rows: 3 }),
    button_label: f.text({ label: 'Button label', group: 'content', default: 'Show more', maxLength: 40 }),
    reveal_text: f.textarea({ label: 'Revealed text', group: 'content', required: true, rows: 4 }),

    // ── A picture, supplied by Graphics ───────────────────────────────────────────────────
    // `accept: 'image'` turns this into a media slot: a picker over the asset library, and an entry on
    // the Graphic Artist's parts list. On export KBF copies the file into the package and rewrites
    // this value to point at the copy, so the component only ever sees a URL that works.
    image: f.url({
      label: 'Picture', group: 'content', accept: 'image',
      optional: true,          // an empty slot is fine; it stays off the parts list until asked for
      altField: 'image_alt',   // the field that describes the picture (below)
      // The size to supply: twice the size the component draws it. A miss is a warning, never a refusal.
      size: { width: 800, height: 600, crop: true, note: 'Drawn in a 4:3 frame beside the text.' },
    }),
    // The ID describes the picture; that description is the learner's alt text. If Graphics marks the
    // picture decorative, KBF empties this before your code sees it, so always use it as given.
    image_alt: f.text({ label: 'Picture description (alt text)', group: 'content' }),
    // `ga: true`: the Graphic Artist may set this. Only `select`, `boolean` and `color` fields can be.
    image_side: f.select({
      label: 'Picture side', group: 'setup', ga: true, default: 'left',
      options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }],
    }),

    // ── The developer's settings ──────────────────────────────────────────────────────────
    allow_hide: f.boolean({
      label: 'Learner can hide the text again', group: 'setup', default: true,
      help: 'Off: once shown, the text stays shown.',
    }),
  },
})
