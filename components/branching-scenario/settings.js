// Branching Scenario — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Interactives',
  icon: 'shuffle',
  completion: 'explicit',
  styleTokens: [
    '--kbf-border-radius',
    '--kbf-color-bg',
    '--kbf-color-border',
    '--kbf-color-correct',
    '--kbf-color-incorrect',
    '--kbf-color-muted',
    '--kbf-color-primary',
    '--kbf-color-surface',
    '--kbf-color-text',
    '--kbf-color-track',
    '--kbf-font-body',
    '--kbf-font-heading',
    '--kbf-color-hover-bg',
    '--kbf-color-hover-text',
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
  ],

  fields: {
    step1_situation: f.textarea({ label: 'Step 1 — situation description', group: 'content' }),
    step1_choice_a: f.text({ label: 'Step 1 Choice A text', group: 'content' }),
    step1_choice_b: f.text({ label: 'Step 1 Choice B text', group: 'content' }),
    step1_choice_c: f.text({ label: 'Step 1 Choice C text (optional)', group: 'content' }),
    step1_a_next: f.select({
      label: 'Step 1 Choice A leads to',
      group: 'content',
      options: [{ value: 'step2', label: 'Go to step 2' }, { value: 'step3', label: 'Go to step 3' }, { value: 'pass', label: 'End on the pass outcome' }, { value: 'fail', label: 'End on the fail outcome' }],
    }),
    step1_b_next: f.select({
      label: 'Step 1 Choice B leads to',
      group: 'content',
      options: [{ value: 'step2', label: 'Go to step 2' }, { value: 'step3', label: 'Go to step 3' }, { value: 'pass', label: 'End on the pass outcome' }, { value: 'fail', label: 'End on the fail outcome' }],
    }),
    // A select like its two siblings above. As free text, a typo — or a value left over from an
    // earlier edit — fell through the destination lookup in `component.js` to `fail`, so the learner
    // was told they'd got it wrong for taking the branch the ID meant to be right.
    step1_c_next: f.select({
      label: 'Step 1 Choice C leads to (optional)',
      group: 'content',
      options: [{ value: 'step2', label: 'Go to step 2' }, { value: 'step3', label: 'Go to step 3' }, { value: 'pass', label: 'End on the pass outcome' }, { value: 'fail', label: 'End on the fail outcome' }],
    }),
    step2_situation: f.textarea({
      label: 'Step 2 — situation description (optional)',
      group: 'content',
    }),
    step2_choice_a: f.text({ label: 'Step 2 Choice A (optional)', group: 'content' }),
    step2_choice_b: f.text({ label: 'Step 2 Choice B (optional)', group: 'content' }),
    step2_choice_c: f.text({ label: 'Step 2 Choice C (optional)', group: 'content' }),
    step2_a_next: f.select({
      label: 'Step 2 A leads to',
      group: 'content',
      options: [{ value: 'step3', label: 'Go to step 3' }, { value: 'pass', label: 'End on the pass outcome' }, { value: 'fail', label: 'End on the fail outcome' }],
    }),
    step2_b_next: f.select({
      label: 'Step 2 B leads to',
      group: 'content',
      options: [{ value: 'step3', label: 'Go to step 3' }, { value: 'pass', label: 'End on the pass outcome' }, { value: 'fail', label: 'End on the fail outcome' }],
    }),
    step2_c_next: f.select({
      label: 'Step 2 C leads to (optional)',
      group: 'content',
      options: [{ value: 'step3', label: 'Go to step 3' }, { value: 'pass', label: 'End on the pass outcome' }, { value: 'fail', label: 'End on the fail outcome' }],
    }),
    step3_situation: f.textarea({
      label: 'Step 3 — situation description (optional)',
      group: 'content',
    }),
    step3_choice_a: f.text({ label: 'Step 3 Choice A (optional)', group: 'content' }),
    step3_choice_b: f.text({ label: 'Step 3 Choice B (optional)', group: 'content' }),
    step3_a_next: f.select({
      label: 'Step 3 A leads to',
      group: 'content',
      options: [{ value: 'pass', label: 'End on the pass outcome' }, { value: 'fail', label: 'End on the fail outcome' }],
    }),
    step3_b_next: f.select({
      label: 'Step 3 B leads to',
      group: 'content',
      options: [{ value: 'pass', label: 'End on the pass outcome' }, { value: 'fail', label: 'End on the fail outcome' }],
    }),
    pass_title: f.text({ label: 'Pass outcome title', group: 'content' }),
    pass_message: f.textarea({ label: 'Pass outcome message', group: 'content' }),
    fail_title: f.text({ label: 'Fail outcome title', group: 'content' }),
    fail_message: f.textarea({ label: 'Fail outcome message', group: 'content' }),
    retry_label: f.text({
      label: 'Retry button label (optional, default: Try Again)',
      group: 'content',
    }),
    // Shown only while the page's Lock Next is on, the one time it does anything (Chris, 2026-10-10):
    // Lock Next holds the page, and this says what this component must see first, or exempts it.
    blocking: f.boolean({
      label: 'Learner must reach a passing ending to go on', group: 'content', default: true, whenLocked: true,
      help: 'Off, any ending lets them go on.',
    }),
  },
})
