// Confetti — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Slides & Layout',
  icon: 'party-popper',
  completion: 'explicit',
  styleTokens: [
    '--kbf-color-bg',
    '--kbf-color-heading',
    '--kbf-color-text',
    '--kbf-font-body',
    '--kbf-font-heading',
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
  ],

  fields: {
    title: f.text({ label: 'Celebration title', group: 'content' }),
    subtitle: f.textarea({ label: 'Subtitle message (optional)', group: 'content' }),
  },
})
