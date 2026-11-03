// Narration Slide — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Slides & Layout',
  icon: 'book-open',
  completion: 'auto',
  styleTokens: ['--kbf-color-heading', '--kbf-color-text', '--kbf-font-body', '--kbf-font-heading'],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
  ],

  fields: {
    headline: f.text({ label: 'Slide Headline', group: 'content' }),
    on_screen_text: f.text({ label: 'On-Screen Text', group: 'content' }),
    author_notes: f.textarea({ label: 'Author Notes (internal)', group: 'content' }),
  },
})
