// Flashcard — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Interactives',
  icon: 'rotate-ccw',
  completion: 'explicit',
  styleTokens: [
    '--kbf-border-radius',
    '--kbf-color-bg',
    '--kbf-color-heading',
    '--kbf-color-muted',
    '--kbf-color-primary',
    '--kbf-color-surface',
    '--kbf-color-text',
    '--kbf-font-body',
    '--kbf-font-heading',
    '--kbf-color-card-back',
    '--kbf-color-card-back-heading',
    '--kbf-color-card-back-text',
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
  ],

  fields: {
    // In the order the card reads, named for what each is (Chris, 2026-10-10). The keys are unchanged,
    // so a placed card keeps what was typed into it.
    front_title: f.text({ label: 'Front title', group: 'content' }),
    front_label: f.text({ label: 'Front text', group: 'content' }),
    back_title: f.text({ label: 'Back title (optional)', group: 'content' }),
    back_description: f.textarea({ label: 'Back text', group: 'content' }),
    // No accent colour of its own (Chris, 2026-10-21): the bar is Primary Accent from the series' Colors.
    // Shown only while the page's Lock Next is on, the one time it does anything (Chris, 2026-10-10):
    // Lock Next holds the page, and this says what this component must see first, or exempts it.
    blocking: f.boolean({
      label: 'Learner must finish this to go on', group: 'content', default: true, whenLocked: true,
      help: 'Holds the page until the card is flipped. Off, this card does not hold it.',
    }),
  },
})
