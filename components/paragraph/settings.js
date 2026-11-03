// Paragraph — one plain paragraph of text (Chris, 2026-10-10).
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
  icon: 'pilcrow',
  completion: 'auto',
  styleTokens: ['--kbf-color-text', '--kbf-font-body'],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
    { key: 'design', label: 'Design', owner: 'dev', order: 2 },
  ],

  fields: {
    text: f.textarea({ label: 'Paragraph text', group: 'content', required: true }),
    ...designFields(),
  },
})
