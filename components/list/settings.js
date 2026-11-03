// List — a bulleted or numbered list, nested up to four levels (Chris, 2026-10-10).
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
  icon: 'list',
  completion: 'auto',
  styleTokens: ['--kbf-color-text', '--kbf-font-body'],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
    { key: 'design', label: 'Design', owner: 'dev', order: 2 },
  ],

  fields: {
    list_type: f.select({
      label: 'List type', group: 'content', default: 'ul',
      options: [{ value: 'ul', label: 'Bulleted' }, { value: 'ol', label: 'Numbered' }],
    }),
    // One row per item with its own indent, because the SDK refuses a repeater inside a repeater.
    // `component.js` builds the nested lists from the levels.
    items: f.repeater({
      label: 'Items',
      group: 'content',
      itemLabel: 'Item',
      min: 1,
      fields: {
        text: f.text({ label: 'Item text', required: true }),
        level: f.select({
          label: 'Indent', default: '1',
          options: [
            { value: '1', label: 'Level 1' }, { value: '2', label: 'Level 2 — under the item above' },
            { value: '3', label: 'Level 3' }, { value: '4', label: 'Level 4' },
          ],
        }),
      },
    }),
    ...designFields(),
  },
})
