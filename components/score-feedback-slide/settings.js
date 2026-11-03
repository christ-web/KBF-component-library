// Score Feedback Slide — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Quiz & Assessment',
  icon: 'trophy',
  completion: 'explicit',
  styleTokens: [
    '--kbf-color-bg',
    '--kbf-color-correct',
    '--kbf-color-heading',
    '--kbf-color-incorrect',
    '--kbf-color-text',
    '--kbf-font-body',
    '--kbf-font-heading',
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
    // `dev`, matching the other three slides — `owner` is about who arranges the page, and the one
    // field in here is Graphics' by its own `ga: true` flag rather than by the group it sits in.
    { key: 'design', label: 'Design', owner: 'dev', order: 2 },
  ],

  // There is no score field here, and no passing percentage either — Chris's ruling of 2026-09-21.
  // The learner's mark comes from the player as `kbf.score`, and the bar it was judged against is the
  // one on the quiz that did the judging (`quiz-pool`'s `passing_pct`). A second bar on this slide
  // could disagree with the first, and the way that failure presents is the worst one available: a
  // slide congratulating a learner the LMS recorded as failed. A typed score had the same defect in a
  // blunter form — it was whatever the dev happened to enter, for every learner.
  //
  // What is left is the words. `{score}`, `{total}` and `{pct}` are substituted from the real result.
  fields: {
    pass_title: f.text({
      label: 'Pass title (supports {score}, {total}, {pct})',
      group: 'content',
    }),
    pass_subtitle: f.text({ label: 'Pass subtitle (optional, same tokens)', group: 'content' }),
    pass_message: f.textarea({ label: 'Pass body message (optional)', group: 'content' }),
    pass_image: f.url({ optional: true, altField: 'pass_image_alt', label: 'Pass image (optional)', group: 'content', accept: 'image', size: { width: 600, height: 450, note: 'Shown whole in a 4:3 space; a picture on a transparent ground suits it.' } }),
    // Both images share one `<img>` (component.html:3) but not one alt: which of the two is showing
    // depends on the learner's result, so a single field would describe the wrong picture half the time.
    // Since 2026-10-02 Graphics marks each picture Decorative or Contextual; the words are kept either way.
    pass_image_alt: f.text({
      label: 'Pass image alt text',
      group: 'content',
      help: 'What the picture shows, in a sentence. Graphics decides whether a screen reader reads it.',
    }),
    fail_title: f.text({
      label: 'Fail title (supports {score}, {total}, {pct})',
      group: 'content',
    }),
    fail_subtitle: f.text({ label: 'Fail subtitle (optional)', group: 'content' }),
    fail_message: f.textarea({ label: 'Fail body message (optional)', group: 'content' }),
    fail_image: f.url({ optional: true, altField: 'fail_image_alt', label: 'Fail image (optional)', group: 'content', accept: 'image', size: { width: 600, height: 450, note: 'Shown whole in a 4:3 space; a picture on a transparent ground suits it.' } }),
    fail_image_alt: f.text({
      label: 'Fail image alt text',
      group: 'content',
      help: 'What the picture shows, in a sentence. Graphics decides whether a screen reader reads it.',
    }),
    // CSS `background-image` (component.js:30) — no element, so no alt field.
    background_image: f.url({ optional: true, label: 'Background image (optional)', group: 'content', accept: 'image', size: { width: 2048, height: 1536, crop: true, note: 'Cropped to fill the page, so keep the subject near the center.' } }),
    // `ga: true` — Graphics delivers `background_image`, so the veil it needs is theirs to tune
    // (Chris's ruling of 2026-09-21). Defaulted on: the untouched field has to be the readable one.
    // The veil is always white here, unlike the other three slides — this component has no
    // `text_color`, and everything it paints is a dark token or a mid-tone result colour.
    scrim: f.boolean({
      label: 'Fade the background image behind the result',
      group: 'design',
      ga: true,
      default: true,
      help: 'Keeps the score and message readable over a photo. Ignored when no background image is set.',
    }),
  },
})
