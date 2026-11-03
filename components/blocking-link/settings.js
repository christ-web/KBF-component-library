// Blocking Link — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Slides & Layout',
  icon: 'link',
  completion: 'explicit',
  styleTokens: [
    '--kbf-border-radius',
    '--kbf-color-bg',
    '--kbf-color-correct',
    '--kbf-color-muted',
    '--kbf-color-primary',
    '--kbf-font-body',
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
  ],

  fields: {
    text: f.text({ label: 'Link text', group: 'content' }),
    href: f.url({ label: 'Link URL', group: 'content' }),
    instructions: f.text({ label: 'Instruction text above the link (optional)', group: 'content' }),
  },
})
