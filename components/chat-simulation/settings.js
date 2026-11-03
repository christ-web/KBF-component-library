// Chat Simulation — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Interactives',
  icon: 'messages-square',
  completion: 'explicit',
  styleTokens: [
    '--kbf-color-bg',
    '--kbf-color-muted',
    '--kbf-color-primary',
    '--kbf-color-text',
    '--kbf-font-body',
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
  ],

  fields: {
    contact_name: f.text({ label: 'Contact / sender name', group: 'content' }),
    // No alt field: component.js:16 paints this as a CSS `background-image` on the avatar circle, so
    // there is no element to carry alt text — the contact's name beside it is the accessible label.
    avatar_url: f.url({ optional: true, label: 'Contact avatar image (optional)', group: 'content', accept: 'image', size: { width: 200, height: 200, crop: true, note: 'Shown as a small circle.' } }),
    date: f.text({ label: 'Date label shown in conversation (optional)', group: 'content' }),
    msg1: f.textarea({ label: 'Message 1 text', group: 'content' }),
    msg1_sent: f.boolean({ label: 'Message 1 sent by me', group: 'content' }),
    msg1_time: f.text({ label: 'Message 1 timestamp (optional)', group: 'content' }),
    msg2: f.textarea({ label: 'Message 2 text (optional)', group: 'content' }),
    msg2_sent: f.boolean({ label: 'Message 2 sent by me', group: 'content' }),
    msg2_time: f.text({ label: 'Message 2 timestamp (optional)', group: 'content' }),
    msg3: f.textarea({ label: 'Message 3 text (optional)', group: 'content' }),
    msg3_sent: f.boolean({ label: 'Message 3 sent by me', group: 'content' }),
    msg3_time: f.text({ label: 'Message 3 timestamp (optional)', group: 'content' }),
    msg4: f.textarea({ label: 'Message 4 text (optional)', group: 'content' }),
    msg4_sent: f.boolean({ label: 'Message 4 sent by me', group: 'content' }),
    msg4_time: f.text({ label: 'Message 4 timestamp (optional)', group: 'content' }),
    msg5: f.textarea({ label: 'Message 5 text (optional)', group: 'content' }),
    msg5_sent: f.boolean({ label: 'Message 5 sent by me', group: 'content' }),
    msg5_time: f.text({ label: 'Message 5 timestamp (optional)', group: 'content' }),
    msg6: f.textarea({ label: 'Message 6 text (optional)', group: 'content' }),
    msg6_sent: f.boolean({ label: 'Message 6 sent by me', group: 'content' }),
    msg6_time: f.text({ label: 'Message 6 timestamp (optional)', group: 'content' }),
  },
})
