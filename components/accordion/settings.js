// Accordion — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Interactives',
  icon: 'layers',
  completion: 'explicit',
  styleTokens: [
    '--kbf-border-radius',
    '--kbf-color-bg',
    '--kbf-color-correct',
    '--kbf-color-muted',
    '--kbf-color-primary',
    '--kbf-color-surface',
    '--kbf-color-text',
    '--kbf-font-body',
    '--kbf-color-hover-bg',
    '--kbf-color-hover-text',
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
  ],

  fields: {
    item1_title: f.text({ label: 'Item 1 title', group: 'content' }),
    item1_body: f.textarea({ label: 'Item 1 body', group: 'content' }),
    item2_title: f.text({ label: 'Item 2 title (optional)', group: 'content' }),
    item2_body: f.textarea({ label: 'Item 2 body (optional)', group: 'content' }),
    item3_title: f.text({ label: 'Item 3 title (optional)', group: 'content' }),
    item3_body: f.textarea({ label: 'Item 3 body (optional)', group: 'content' }),
    item4_title: f.text({ label: 'Item 4 title (optional)', group: 'content' }),
    item4_body: f.textarea({ label: 'Item 4 body (optional)', group: 'content' }),
    // Shown only while the page's Lock Next is on, the one time it does anything (Chris, 2026-10-10):
    // Lock Next holds the page, and this says what this component must see first, or exempts it.
    blocking: f.boolean({
      label: 'Learner must finish this to go on', group: 'content', default: true, whenLocked: true,
      help: 'Holds the page until every item is opened. Off, this accordion does not hold it.',
    }),
  },
})
