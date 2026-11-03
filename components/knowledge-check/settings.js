// Knowledge Check — component settings.
//
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
//
// ## Why this was rewritten by hand
//
// v1 had four fixed `choice_a`…`choice_d` fields plus a `correct` text box holding something
// like `a, c`. That string was the only place the component's *interaction mode* was recorded:
// component.js counted the letters and rendered radio buttons for one and checkboxes for more.
// So a stray comma turned a single-answer question into a multi-select, and there were exactly
// four choices forever.
//
// A `choices` repeater with a `correct` boolean per row says the same thing directly: the row
// is the choice, the flag on it is the answer, and the count of flagged rows is what decides
// single versus multi-select. The flag is `secret`, so the export encodes it per row while each
// choice's text stays readable — the learner has to be able to see the options.
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Quiz & Assessment',
  icon: 'help-circle',
  completion: 'explicit',
  styleTokens: [
    '--kbf-border-radius',
    '--kbf-color-bg',
    '--kbf-color-border',
    '--kbf-color-heading',
    '--kbf-color-primary',
    '--kbf-color-surface',
    '--kbf-color-text',
    '--kbf-color-track',
    '--kbf-font-body',
    '--kbf-color-hover-bg',
    '--kbf-color-hover-text',
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
    {
      key: 'choices',
      label: 'Choices',
      owner: 'id',
      order: 1,
      help: 'Mark every correct choice. Marking more than one turns the question into a multi-select.',
    },
    { key: 'feedback', label: 'Feedback', owner: 'id', order: 2 },
  ],

  fields: {
    question: f.textarea({ label: 'Question', group: 'content', required: true }),

    choices: f.repeater({
      label: 'Choices',
      group: 'choices',
      itemLabel: 'Choice',
      min: 2,
      max: 6,
      // At least one, not exactly one: marking two is how this question becomes a multi-select,
      // which the group help above invites. Marking none was the silent failure — it saved fine and
      // then graded every attempt wrong, on a page `lock_next` wouldn't let the learner leave.
      answerFlag: { field: 'correct', value: true, mode: 'multi' },
      fields: {
        text: f.text({ label: 'Choice', required: true }),
        correct: f.boolean({
          label: 'Correct',
          secret: true,
          default: false,
          help: 'Never sent to the learner in readable form.',
        }),
      },
    }),

    feedback_correct: f.textarea({ label: 'Feedback — Correct', group: 'feedback' }),
    feedback_incorrect: f.textarea({ label: 'Feedback — Incorrect', group: 'feedback' }),
  },
})
