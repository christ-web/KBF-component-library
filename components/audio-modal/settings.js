// Audio Modal — component settings.
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
    '--kbf-border-radius',
    '--kbf-color-bg',
    '--kbf-color-correct',
    '--kbf-color-primary',
    '--kbf-color-surface',
    '--kbf-color-text',
    '--kbf-font-body',
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
  ],

  fields: {
    // Three tracks, so three transcripts — each one belongs to its own recording and there is nothing
    // to share. The warning is audio-player's word for word: an audio-only recording with no transcript
    // fails WCAG 1.2.1 Audio-only (Prerecorded), which is Level A, below KBF's own AA floor. This
    // component shipped with no transcript field at all, so until now every track it played was one.
    // The covers get no alt field: component.js paints them as CSS `background-image` on the tile and
    // again in the modal (:43, :101), and the tile title is the accessible label in both places.
    tile1_src: f.url({ label: 'Tile 1 audio file', group: 'content', accept: 'audio' }),
    tile1_cover: f.url({ optional: true, label: 'Tile 1 cover image (optional)', group: 'content', accept: 'image', size: { width: 400, height: 400, crop: true, note: 'Cropped to a square.' } }),
    tile1_vtt: f.url({
      label: 'Tile 1 transcript VTT',
      group: 'content',
      accept: 'caption',
      warnWhenEmpty: 'No transcript: this track will ship without one, which fails WCAG 1.2.1 (Level A). Add a VTT file.',
    }),
    tile1_title: f.text({ label: 'Tile 1 title', group: 'content' }),
    tile2_src: f.url({ optional: true, label: 'Tile 2 audio file (optional)', group: 'content', accept: 'audio' }),
    tile2_cover: f.url({ optional: true, label: 'Tile 2 cover image (optional)', group: 'content', accept: 'image', size: { width: 400, height: 400, crop: true, note: 'Cropped to a square.' } }),
    // No `warnWhenEmpty` on tiles 2 and 3: their audio is optional, so an empty transcript beside an
    // empty track is the ordinary state of an unused tile rather than a missing transcript. The parts
    // list is what surfaces a track that has audio and no transcript.
    tile2_vtt: f.url({ label: 'Tile 2 transcript VTT', group: 'content', accept: 'caption' }),
    tile2_title: f.text({ label: 'Tile 2 title (optional)', group: 'content' }),
    tile3_src: f.url({ optional: true, label: 'Tile 3 audio file (optional)', group: 'content', accept: 'audio' }),
    tile3_cover: f.url({ optional: true, label: 'Tile 3 cover image (optional)', group: 'content', accept: 'image', size: { width: 400, height: 400, crop: true, note: 'Cropped to a square.' } }),
    tile3_vtt: f.url({ label: 'Tile 3 transcript VTT', group: 'content', accept: 'caption' }),
    tile3_title: f.text({ label: 'Tile 3 title (optional)', group: 'content' }),
    // Shown only while the page's Lock Next is on, the one time it does anything (Chris, 2026-10-10):
    // Lock Next holds the page, and this says what this component must see first, or exempts it.
    blocking: f.boolean({
      label: 'Learner must finish this to go on', group: 'content', default: true, whenLocked: true,
      help: 'Holds the page until every tile is opened. Off, these tiles do not hold it.',
    }),
  },
})
