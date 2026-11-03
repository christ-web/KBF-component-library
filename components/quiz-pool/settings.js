// Quiz Pool — component settings.
//
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
//
// ## Why this was rewritten by hand
//
// The v1 schema was 34 flat keys: `q1_text`, `q1_a`…`q1_d`, `q1_correct`, then the same again
// four more times. Three things were wrong with it.
//
// 1. **Five questions, permanently.** The count was a property of the schema, so a sixth
//    question needed a KBF-side change. Worse, the exporter's answer-obfuscation list also
//    stopped at `q5`, so a sixth question would have shipped its answer key in plaintext.
// 2. **`q1_correct` meant nothing on its own.** It stored the letter `b`, which resolves to an
//    answer only by reading a *sibling field's name* (`q1_b`). Nothing in the schema said so;
//    the coupling lived in a label reading "Q1 Correct: a, b, c, or d" and in component.js.
// 3. **The panel was a wall of 34 inputs** with no visible grouping of a question to its own
//    options — which is the unit an ID is actually editing.
//
// One `questions` repeater fixes all three: unbounded, each row self-contained, and the answer is
// `secret` so the export encodes it however many rows there are.
//
// ## Why the options are an `options` field and not four text fields
//
// The first pass kept the options flat within a row (`a`…`d`, plus a `correct` select naming one
// of those letters) because repeaters can't nest — see `_sdk/index.js`. That left the original
// bug in place with a shorter reach: C and D were optional, so "correct: D" with D blank rendered
// a question no learner could get right, and the ID couldn't add a fifth option or drop to three.
//
// `f.options` is a leaf field whose value is a list of `{ text, correct }` rows. Because the row
// shape is fixed and known, it can be a leaf — so it sidesteps the no-nesting rule rather than
// relaxing it. Correctness is a flag *on the row it belongs to*, so deleting an option takes its
// flag with it and there is no letter left pointing at nothing. `mode: 'single'` renders the rows
// as a radio group, which is what keeps exactly one of them flagged at all times.
//
// The A/B/C badge the learner sees is derived from the row's position at render time. It is
// presentation, not identity — nothing stored refers to a letter.
//
// ## More than one right answer, and a pool (2.3.0, Chris, 2026-10-27)
//
// `mode: 'multi'`: a question may mark several options correct. One marked is a single-answer
// question, as before; two or more and the learner is told "Select all that apply", answers with
// checkboxes, and is right only with every correct option chosen and nothing else — Knowledge
// Check's rule. Every existing question has exactly one marked, which `multi` still accepts.
//
// `questions_shown`: how many questions each learner is given, drawn at random from the list on
// every attempt and every retake. Blank is all of them, which is what every existing quiz does. The
// mark and the pass are out of the questions shown: 5 of 10 shown at 80% passes with 4 right.
// No default, for the reason `exclude_from_score` has none: a default would change every quiz
// already placed. Added in place rather than as a new component under the POC's relaxed protocol.
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Quiz & Assessment',
  icon: 'list-checks',
  completion: 'explicit',
  // The only scoring component in the library. A module reports no score and no completion until
  // every placed Quiz Pool says the learner passed it; everything else that asks questions —
  // Knowledge Check, Multiple Choice Quiz, Dropdown Activity, Branching Scenario — is formative.
  scored: true,
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
    '--kbf-color-track',
    '--kbf-font-body',
    '--kbf-font-heading',
    '--kbf-color-hover-bg',
    '--kbf-color-hover-text',
  ],

  groups: [
    {
      key: 'questions',
      label: 'Questions',
      owner: 'id',
      order: 0,
      help: 'Each question needs two options at minimum. Asked in this order, or a random set of them.',
    },
    {
      key: 'results',
      label: 'Results Screen',
      owner: 'id',
      order: 1,
      help: 'Titles and messages accept {score}, {total} and {pct}.',
    },
    // The ID's since 2026-10-01: an ID sets every setting that controls flow and scoring (Chris).
    // Labelled Scoring (Chris, 2026-10-10); the key stays `behavior`, so nothing stored moves.
    { key: 'behavior', label: 'Scoring', owner: 'id', order: 2 },
  ],

  fields: {
    questions: f.repeater({
      label: 'Questions',
      group: 'questions',
      itemLabel: 'Question',
      min: 1,
      max: 20,
      fields: {
        text: f.textarea({ label: 'Question', required: true, rows: 2 }),
        options: f.options({
          label: 'Answer options',
          mode: 'multi',
          min: 2,
          max: 6,
          itemLabel: 'Option',
          help: 'Mark the correct one, or several for a "select all that apply" question. Which answers are right is never sent to the learner in readable form.',
        }),
      },
    }),

    questions_shown: f.number({
      label: 'Questions shown to each learner',
      group: 'questions',
      min: 1,
      max: 20,
      help: 'A random set is drawn on every attempt. Blank shows every question.',
    }),

    passing_pct: f.number({
      label: 'Passing percentage',
      group: 'results',
      default: 80,
      min: 0,
      max: 100,
      unit: '%',
    }),
    pass_title: f.text({ label: 'Pass screen title', group: 'results', default: 'You passed!' }),
    pass_message: f.textarea({ label: 'Pass screen message', group: 'results' }),
    fail_title: f.text({ label: 'Fail screen title', group: 'results', default: 'Not quite.' }),
    fail_message: f.textarea({ label: 'Fail screen message', group: 'results' }),

    // Shown only while the page's Lock Next is on, the one time it does anything (Chris, 2026-10-10):
    // Lock Next holds the page, and this says what this component must see first, or exempts it.
    blocking: f.boolean({
      label: 'Learner must pass to go on',
      group: 'behavior',
      default: true,
      whenLocked: true,
      help: 'Off, they may go on after finishing, whatever the score.',
    }),

    // No default, on purpose, and the revision rule is what requires it: a new field arriving *with*
    // a default changes what every existing instance renders, so the contract diff refuses it and
    // this could not have shipped as a maintenance revision.
    //
    // Which is also why it is phrased as an exclusion rather than as "record this quiz". A boolean
    // with no default renders unticked, so the tick has to mean the *non*-default thing — a box
    // reading "Record in the module score" sitting unticked on a quiz that is being recorded is the
    // kind of panel someone reads once and then mistrusts.
    //
    // "Non-scoring", with no explanation under it (Chris, 2026-10-10). Ticked, the quiz is a knowledge
    // check: its questions leave the module's mark, and passing it no longer completes the module.
    exclude_from_score: f.boolean({
      label: 'Non-scoring',
      group: 'behavior',
    }),
  },
})
