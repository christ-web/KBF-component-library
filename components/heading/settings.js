// Heading — a single heading the ID writes and ranks, H1 to H6 (Chris, 2026-10-10).
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

// The Design group every text block shares (Chris, 2026-10-10): alignment, `ga: true`, Graphics' to set per
// page through `PATCH …/ga-design`; the ID writes the words above. Colour and type left on 2026-10-21
// (Chris): they are the series', in Series Styles — Body Text and Heading Text, Text Box Background, and
// Typography — and none is offered per component until he has been through each one.
const designFields = (alignDefault = 'left') => ({
  align: f.select({
    label: 'Alignment', group: 'design', ga: true, default: alignDefault,
    options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centered' }, { value: 'right', label: 'Right' }],
  }),
})

export default defineSettings({
  category: 'Text',
  icon: 'heading',
  completion: 'auto',
  styleTokens: ['--kbf-color-heading', '--kbf-font-heading'],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
    { key: 'design', label: 'Design', owner: 'dev', order: 2 },
  ],

  fields: {
    text: f.text({ label: 'Heading text', group: 'content', required: true }),
    // The rank is structure, not look, so it is the ID's: a screen reader lists a page by its headings
    // (2.4.10), and skipping a level breaks that outline.
    level: f.select({
      label: 'Heading level', group: 'content', default: 'h2',
      options: [
        { value: 'h1', label: 'H1 — the page title' },
        { value: 'h2', label: 'H2' }, { value: 'h3', label: 'H3' }, { value: 'h4', label: 'H4' },
        { value: 'h5', label: 'H5' }, { value: 'h6', label: 'H6' },
      ],
      help: 'Use one H1 per page, and do not skip a level going down.',
    }),
    // Centred unless Graphics says otherwise (Chris, 2026-10-11).
    ...designFields('center'),
  },
})
