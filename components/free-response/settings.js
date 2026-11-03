// Free Response — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Quiz & Assessment',
  icon: 'pen-line',
  completion: 'explicit',
  styleTokens: [
    '--kbf-border-radius',
    '--kbf-color-border',
    '--kbf-color-heading',
    '--kbf-color-muted',
    '--kbf-color-primary',
    '--kbf-color-surface',
    '--kbf-color-text',
    '--kbf-font-body',
    '--kbf-font-heading',
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
  ],

  fields: {
    title: f.text({ label: 'Activity title', group: 'content' }),
    instructions: f.textarea({ label: 'Instructions for learner', group: 'content' }),
    q1: f.textarea({ label: 'Question 1', group: 'content' }),
    q1_suggested: f.textarea({ label: 'Suggested answer 1', group: 'content' }),
    q2: f.textarea({ label: 'Question 2 (optional)', group: 'content' }),
    q2_suggested: f.textarea({ label: 'Suggested answer 2 (optional)', group: 'content' }),
    q3: f.textarea({ label: 'Question 3 (optional)', group: 'content' }),
    q3_suggested: f.textarea({ label: 'Suggested answer 3 (optional)', group: 'content' }),
    submit_label: f.text({ label: 'Submit button label', group: 'content' }),
    feedback_title: f.text({ label: 'Feedback panel title', group: 'content' }),
    feedback_description: f.textarea({ label: 'Feedback panel description', group: 'content' }),
  },
})
