// Email Deep Dive — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Interactives',
  icon: 'mail-search',
  completion: 'explicit',
  styleTokens: [
    '--kbf-border-radius',
    '--kbf-color-bg',
    '--kbf-color-border',
    '--kbf-color-correct',
    '--kbf-color-heading',
    '--kbf-color-incorrect',
    '--kbf-color-muted',
    '--kbf-color-primary',
    '--kbf-color-surface',
    '--kbf-color-text',
    '--kbf-font-body',
    '--kbf-font-heading',
    '--kbf-color-hover-bg',
    '--kbf-color-hover-text',
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
  ],

  fields: {
    from: f.text({ label: 'Sender display name / address', group: 'content' }),
    to: f.text({ label: 'Recipient display name / address', group: 'content' }),
    subject: f.text({ label: 'Email subject', group: 'content' }),
    date: f.text({ label: 'Date/time string (e.g. Mon, June 2 at 10:14 AM)', group: 'content' }),
    body: f.textarea({ label: 'Email body (plain text or basic HTML)', group: 'content' }),
    flag1_label: f.text({ label: 'Flag 1 label (e.g. \'Sender address\')', group: 'content' }),
    flag1_type: f.text({ label: 'Flag 1 type: red (suspicious) or safe', group: 'content' }),
    flag1_explanation: f.textarea({
      label: 'Flag 1 explanation shown to learner',
      group: 'content',
    }),
    flag2_label: f.text({ label: 'Flag 2 label (optional)', group: 'content' }),
    flag2_type: f.text({ label: 'Flag 2 type: red or safe (optional)', group: 'content' }),
    flag2_explanation: f.textarea({ label: 'Flag 2 explanation (optional)', group: 'content' }),
    flag3_label: f.text({ label: 'Flag 3 label (optional)', group: 'content' }),
    flag3_type: f.text({ label: 'Flag 3 type: red or safe (optional)', group: 'content' }),
    flag3_explanation: f.textarea({ label: 'Flag 3 explanation (optional)', group: 'content' }),
    flag4_label: f.text({ label: 'Flag 4 label (optional)', group: 'content' }),
    flag4_type: f.text({ label: 'Flag 4 type: red or safe (optional)', group: 'content' }),
    flag4_explanation: f.textarea({ label: 'Flag 4 explanation (optional)', group: 'content' }),
    flag5_label: f.text({ label: 'Flag 5 label (optional)', group: 'content' }),
    flag5_type: f.text({ label: 'Flag 5 type: red or safe (optional)', group: 'content' }),
    flag5_explanation: f.textarea({ label: 'Flag 5 explanation (optional)', group: 'content' }),
    // Shown only while the page's Lock Next is on, the one time it does anything (Chris, 2026-10-10):
    // Lock Next holds the page, and this says what this component must see first, or exempts it.
    blocking: f.boolean({
      label: 'Learner must finish this to go on', group: 'content', default: true, whenLocked: true,
      help: 'Holds the page until every flag is reviewed. Off, this email does not hold it.',
    }),
  },
})
