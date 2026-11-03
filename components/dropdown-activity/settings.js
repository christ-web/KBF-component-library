// Dropdown Activity — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
//
// ## Why the answers are repeaters
//
// Each question used to be one textarea whose lines carried the answer key inline:
//
//     Report it to IT|right
//     Forward it to a colleague|wrong
//
// That convention was documented nowhere but the field's own label, and it shipped the answer key
// in plaintext in every exported package — a learner reading view-source could see which line
// ended in `|right`. Obfuscating the whole textarea would hide it, but it would also hide the
// option text the learner has to read, and it keeps a hand-parsed convention that offers no
// validation and no editing affordance.
//
// A repeater makes the structure real: one row per option, its text in a text field and its
// verdict in a select marked `secret`, so the exporter encodes the verdicts and nothing else.
import { defineSettings, f } from '../_sdk/index.js'

/**
 * One question's answer list. Three questions have the same shape, and writing the rows out three
 * times is how they drift apart.
 *
 * `neutral` is a third verdict rather than a synonym for wrong: the component marks it with a
 * muted dash instead of a red cross, and it still prevents an all-correct result. That's why the
 * verdict is a select and not the boolean the plan sketched.
 */
const answerRows = (n, { optional = false } = {}) => f.repeater({
  label: optional ? `Question ${n} answer options (optional)` : `Question ${n} answer options`,
  group: 'content',
  itemLabel: 'Option',
  // Two is the floor for a dropdown to be a choice at all; one option is a statement.
  min: 2,
  max: 6,
  // The help below has asked for exactly one Correct since this component was written, and nothing
  // checked it: a list with none marked, or with two, saved happily and then graded every attempt
  // wrong. `neutral` is not "correct", so it doesn't count toward the one.
  answerFlag: { field: 'verdict', value: 'right', mode: 'single' },
  help: 'Mark exactly one option Correct. Learners see the text; the verdict is never sent to them in readable form.',
  // Only shown once the question above it has a label, so an unused question doesn't present an
  // empty answer list. `q1` has no condition — the activity is meaningless without it.
  ...(optional ? { visibleWhen: { field: `q${n}_label`, truthy: true } } : {}),
  fields: {
    text: f.text({ label: 'Option text', required: true }),
    verdict: f.select({
      label: 'Verdict',
      secret: true,
      default: 'wrong',
      options: [
        { value: 'wrong', label: 'Incorrect' },
        { value: 'right', label: 'Correct' },
        { value: 'neutral', label: 'Partially acceptable' },
      ],
    }),
  },
})

export default defineSettings({
  category: 'Quiz & Assessment',
  icon: 'chevron-down-square',
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
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
    // The ID's since 2026-10-01: an ID sets every setting that controls flow and scoring (Chris).
    { key: 'behavior', label: 'Behavior', owner: 'id', order: 3 },
  ],

  fields: {
    title: f.text({ label: 'Activity title', group: 'content', default: 'Dropdown Activity' }),
    instructions: f.textarea({ label: 'Instructions', group: 'content' }),
    q1_label: f.text({ label: 'Question 1', group: 'content', required: true }),
    q1_answers: answerRows(1),
    q2_label: f.text({ label: 'Question 2 (optional)', group: 'content' }),
    q2_answers: answerRows(2, { optional: true }),
    q3_label: f.text({ label: 'Question 3 (optional)', group: 'content' }),
    q3_answers: answerRows(3, { optional: true }),
    correct_feedback: f.textarea({ label: 'All-correct feedback', group: 'content' }),
    incorrect_feedback: f.textarea({ label: 'Some-wrong feedback', group: 'content' }),

    // Course-dev settings: how the activity behaves, not what it says. `submit_label` sits here
    // rather than under Content because it's chrome, and a series wants it consistent across
    // every activity rather than retyped per page.
    submit_label: f.text({ label: 'Submit button label', group: 'behavior', default: 'Submit' }),
    // Shown only while the page's Lock Next is on, the one time it does anything (Chris, 2026-10-10):
    // Lock Next holds the page, and this says what this component must see first, or exempts it.
    blocking: f.boolean({
      label: 'Learner must answer correctly to go on',
      group: 'behavior',
      default: true,
      whenLocked: true,
      help: 'They retry until every answer is right. Off, they may go on after submitting, whatever they chose.',
    }),
  },
})
