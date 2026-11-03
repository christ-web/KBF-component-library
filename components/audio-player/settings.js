// Audio Player — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Media',
  icon: 'volume-2',
  completion: 'explicit',
  styleTokens: [
    '--kbf-color-bg',
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
    // `accept` is what makes these three a stored asset rather than a pasted link: the panel renders a
    // picker, and the slot appears on the Graphic Artist's parts list while it is empty. The labels no
    // longer say "URL" because the control is no longer a URL box — a URL is one way to *fetch* the
    // file, and nothing points at it afterwards.
    src: f.url({ label: 'Audio file (.mp3 / .ogg)', group: 'content', accept: 'audio' }),
    cover_image: f.url({ optional: true, label: 'Cover art image (optional)', group: 'content', accept: 'image', size: { width: 400, height: 400, crop: true, note: 'Cropped to a square.' } }),
    // Same warning video-player's captions field carries, and for the same reason one level up: an
    // audio-only recording with no transcript fails WCAG 1.2.1 Audio-only (Prerecorded), Level A. The
    // field existed here from the start with nothing to say about leaving it blank, which is how a
    // module ships an uncaptioned narration and passes every automated check.
    vtt: f.url({
      label: 'Transcript VTT',
      group: 'content',
      accept: 'caption',
      warnWhenEmpty: 'No transcript: this audio will ship without one, which fails WCAG 1.2.1 (Level A). Add a VTT file.',
    }),
    // Shown only while the page's Lock Next is on, the one time it does anything (Chris, 2026-10-10):
    // Lock Next holds the page, and this says what this component must see first, or exempts it.
    blocking: f.boolean({
      label: 'Learner must finish this to go on', group: 'content', default: true, whenLocked: true,
      help: 'Holds the page until 95% of the audio is heard. Off, this audio does not hold it.',
    }),
  },
})
