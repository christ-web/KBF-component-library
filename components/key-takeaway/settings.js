// Key Takeaway — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Slides & Layout',
  icon: 'book-open',
  completion: 'auto',
  styleTokens: [
    '--kbf-border-radius',
    '--kbf-color-heading',
    '--kbf-color-muted',
    '--kbf-font-body',
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
  ],

  fields: {
    type: f.text({ label: 'Type (info / tip / warning / important)', group: 'content' }),
    headline: f.text({ label: 'Headline', group: 'content' }),
    body: f.textarea({ label: 'Body Text', group: 'content' }),
  },
})
