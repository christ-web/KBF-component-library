// Tabbed Content — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Interactives',
  icon: 'columns-3',
  completion: 'explicit',
  styleTokens: [
    '--kbf-color-bg',
    '--kbf-color-border',
    '--kbf-color-correct',
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
    tab1_title: f.text({ label: 'Tab 1 title', group: 'content' }),
    tab1_content: f.textarea({ label: 'Tab 1 body text', group: 'content' }),
    tab2_title: f.text({ label: 'Tab 2 title (optional)', group: 'content' }),
    tab2_content: f.textarea({ label: 'Tab 2 body text (optional)', group: 'content' }),
    tab3_title: f.text({ label: 'Tab 3 title (optional)', group: 'content' }),
    tab3_content: f.textarea({ label: 'Tab 3 body text (optional)', group: 'content' }),
    tab4_title: f.text({ label: 'Tab 4 title (optional)', group: 'content' }),
    tab4_content: f.textarea({ label: 'Tab 4 body text (optional)', group: 'content' }),
    // Shown only while the page's Lock Next is on, the one time it does anything (Chris, 2026-10-10):
    // Lock Next holds the page, and this says what this component must see first, or exempts it.
    blocking: f.boolean({
      label: 'Learner must finish this to go on', group: 'content', default: true, whenLocked: true,
      help: 'Holds the page until every tab is visited. Off, these tabs do not hold it.',
    }),
  },
})
