// Multiple Choice Quiz — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
//
// ## Why the four option slots became one `options` field
//
// The v1 shape was `option_a`…`option_d` plus a free-text `correct` reading "a, b, c, or d". Three
// separate ways to break it, all silent: C and D were blank-to-hide, so `correct: d` with D empty
// gave a question with no right answer; the field was free text, so `"A "` or `"1"` matched
// nothing; and the count was fixed at four, so an ID could neither add a fifth option nor drop to
// three.
//
// `f.options` is a leaf field holding a list of `{ text, correct }` rows, 2–6 of them, with the
// flag on the row it belongs to. Delete an option and its flag goes with it — there is no letter
// left to dangle. `mode: 'single'` renders as a radio group, so exactly one row is always flagged.
// The A/B/C badge is derived from position at render time, so it is presentation, not identity.
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Quiz & Assessment',
  icon: 'list-checks',
  completion: 'explicit',
  styleTokens: [
    '--kbf-border-radius',
    '--kbf-color-bg',
    '--kbf-color-border',
    '--kbf-color-correct',
    '--kbf-color-heading',
    '--kbf-color-incorrect',
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
    { key: 'answers', label: 'Answer Choices', owner: 'id', order: 1 },
  ],

  fields: {
    question: f.textarea({ label: 'Question', group: 'content' }),
    image: f.url({ optional: true, altField: 'image_alt', label: 'Header image (optional)', group: 'content', accept: 'image', size: { width: 800, height: 600, crop: true, note: 'Shown in a 4:3 frame above the question and cropped to it.' } }),
    // New, and it closes a real hole rather than adding polish: component.js hardcoded `alt = ''` on
    // this `<img>`, so a header image that was part of the question — a screenshot of a phishing email,
    // say — reached a screen-reader user as nothing at all, and the question became unanswerable.
    // Graphics marks each picture Decorative or Contextual (2026-10-02); the words are kept either way.
    image_alt: f.text({
      label: 'Header image alt text',
      group: 'content',
      help: 'What the picture shows, in a sentence — anything the learner needs in order to answer must be here. Graphics decides whether a screen reader reads it.',
    }),
    options: f.options({
      label: 'Answer choices',
      group: 'answers',
      mode: 'single',
      min: 2,
      max: 6,
      itemLabel: 'Choice',
      help: 'Mark the correct one. Which answer is right is never sent to the learner in readable form.',
    }),
    correct_feedback: f.textarea({ label: 'Correct feedback message', group: 'content' }),
    incorrect_feedback: f.textarea({ label: 'Incorrect feedback message', group: 'content' }),
    // Shown only while the page's Lock Next is on, the one time it does anything (Chris, 2026-10-10):
    // Lock Next holds the page, and this says what this component must see first, or exempts it.
    blocking: f.boolean({
      label: 'Learner must answer correctly to go on', group: 'content', default: true, whenLocked: true,
      help: 'Off, any answer lets them go on.',
    }),
  },
})
