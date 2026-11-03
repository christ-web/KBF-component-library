// Email Simulation — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Interactives',
  icon: 'mail',
  completion: 'explicit',
  styleTokens: [
    '--kbf-border-radius',
    '--kbf-color-bg',
    '--kbf-color-border',
    '--kbf-color-muted',
    '--kbf-color-primary',
    '--kbf-color-text',
    '--kbf-font-body',
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
  ],

  fields: {
    from: f.text({ label: 'Sender name and/or email', group: 'content' }),
    subject: f.text({ label: 'Email subject line', group: 'content' }),
    body: f.textarea({ label: 'Email body (plain text or basic HTML)', group: 'content' }),
    attachment_name: f.text({ label: 'Attachment filename (optional)', group: 'content' }),
    attachment_link: f.url({ label: 'Attachment URL (optional)', group: 'content' }),
    blocking: f.boolean({ label: 'Show \'Got it\' button before advancing', group: 'content' }),
  },
})
