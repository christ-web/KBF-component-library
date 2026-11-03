// Video Player — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Media',
  icon: 'video',
  completion: 'explicit',
  styleTokens: [
    '--kbf-border-radius',
    '--kbf-color-bg',
    '--kbf-color-border',
    '--kbf-color-heading',
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
    title: f.text({ label: 'Video title (optional)', group: 'content' }),
    src: f.url({ label: 'Video file (.mp4)', group: 'content', accept: 'video' }),
    // Optional to save, but its absence is an accessibility failure rather than an unfinished
    // field: with no VTT the component builds no <track> at all (component.js), so the video
    // ships uncaptioned. WCAG 1.2.2 Captions (Prerecorded) is Level A — below KBF's own AA floor.
    // axe cannot catch it either; it reports `video-caption` as undecided because it cannot
    // inspect caption content, so this warning is the only thing standing between a blank field
    // and an uncaptioned video reaching a learner.
    vtt: f.url({
      label: 'Captions VTT',
      group: 'content',
      accept: 'caption',
      warnWhenEmpty: 'No captions: this video will ship without them, which fails WCAG 1.2.2 (Level A). Add a VTT file.',
    }),
    // No `poster_alt` beside this one: the value becomes the `<video poster>` attribute
    // (component.js:46), and there is no element to hang alt text on — the video's own accessible name
    // is the `title` above. The ID's brief for the image is the parts-list description instead.
    poster: f.url({ optional: true, label: 'Poster image (optional)', group: 'content', accept: 'image', size: { width: 1920, height: 1080, note: 'Fitted into a 16:9 frame.' } }),
    // Defaults are Chris's of 2026-10-10: captions off until the learner turns them on, the transcript
    // toggle on, and navigation held until 95% is watched. `blocking` already read absent as on in
    // `component.js`; declaring it makes the settings panel say so instead of showing "Disabled".
    show_captions: f.boolean({ label: 'Show captions by default', group: 'content', default: false }),
    show_transcript: f.boolean({ label: 'Show transcript toggle', group: 'content', default: true }),
    // Shown only while the page's Lock Next is on, the one time it does anything (Chris, 2026-10-10):
    // Lock Next holds the page, and this says what this component must see first, or exempts it.
    blocking: f.boolean({
      label: 'Learner must finish this to go on', group: 'content', default: true, whenLocked: true,
      help: 'Holds the page until 95% of the video is watched. Off, this video does not hold it.',
    }),
  },
})
