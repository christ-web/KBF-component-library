// Title Slide — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Slides & Layout',
  icon: 'file-text',
  completion: 'auto',
  styleTokens: [
    '--kbf-color-bg',
    '--kbf-color-heading',
    '--kbf-color-muted',
    '--kbf-color-primary',
    '--kbf-font-body',
    '--kbf-font-heading',
    '--kbf-font-title',
    '--kbf-color-title-bg',
    '--kbf-color-title-heading',
    '--kbf-color-title-muted',
    '--kbf-gradient-from',
    '--kbf-gradient-to',
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
    { key: 'design', label: 'Design', owner: 'dev', order: 2 },
  ],

  fields: {
    title: f.text({ label: 'Title', group: 'content' }),
    subtitle: f.text({ label: 'Subtitle (optional)', group: 'content' }),
    // A CSS `background-image` (component.js:25), so no alt field — there is no element to put one on,
    // and a background that needs describing is content in the wrong place. The ID briefs this one
    // through the parts list's description instead.
    background_image: f.url({ optional: true, label: 'Background image (optional)', group: 'content', accept: 'image', size: { width: 2048, height: 1536, crop: true, note: 'Cropped to fill the page, so keep the subject near the center.' } }),
    // No background colour setting (Chris, 2026-10-21): the slide is Page Background from the series' Colors.
    // `ga: true` — how the title sits on the slide is layout, Graphics' to set rather than the ID's
    // (Chris's ruling of 2026-10-10), so it left the ID's Content group for Design.
    align: f.select({
      label: 'Text alignment',
      group: 'design',
      ga: true,
      options: [{ value: 'center', label: 'Centered' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }],
    }),
    // No text colour of its own (Chris, 2026-10-21): it is the series' Heading Text and Muted Text. A per-slide
    // choice can be ruled back in; the light and brand classes are still in `component.css`.
    // `ga: true` — Graphics delivers `background_image` and this is the consequence of it, so it is
    // theirs to tune (Chris's ruling of 2026-09-21). Defaulted on, because a photograph with no veil
    // is the contrast failure the scrim exists to fix and the untouched field has to be the safe one.
    // Which way the veil goes is not a choice: the text is dark, so the veil is light.
    scrim: f.boolean({
      label: 'Fade the background image behind the text',
      group: 'design',
      ga: true,
      default: true,
      help: 'Keeps the title and subtitle readable over a photo. Ignored when no background image is set.',
    }),
  },
})
