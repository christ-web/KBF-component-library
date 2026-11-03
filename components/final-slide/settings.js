// Final Slide — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Slides & Layout',
  icon: 'flag',
  completion: 'auto',
  styleTokens: [
    '--kbf-border-radius',
    '--kbf-color-bg',
    '--kbf-color-heading',
    '--kbf-color-primary',
    '--kbf-color-text',
    '--kbf-font-body',
    '--kbf-font-heading',
    '--kbf-font-title',
    '--kbf-color-title-bg',
    '--kbf-color-muted',
    '--kbf-color-title-heading',
    '--kbf-color-title-muted',
    '--kbf-color-title-text',
    '--kbf-gradient-from',
    '--kbf-gradient-to',
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
    { key: 'design', label: 'Design', owner: 'dev', order: 2 },
  ],

  fields: {
    title: f.text({ label: 'Main title', group: 'content' }),
    subtitle: f.text({ label: 'Subtitle (optional)', group: 'content' }),
    body: f.textarea({ label: 'Body message (optional)', group: 'content' }),
    // CSS `background-image` (component.js:21) — no element, so no alt field. See title-slide.
    background_image: f.url({ optional: true, label: 'Background image (optional)', group: 'content', accept: 'image', size: { width: 2048, height: 1536, crop: true, note: 'Cropped to fill the page, so keep the subject near the center.' } }),
    // No background colour setting (Chris, 2026-10-21): the slide is Page Background from the series' Colors.
    // No text colour of its own (Chris, 2026-10-21): it is the series' Heading Text and Muted Text. A per-slide
    // choice can be ruled back in; the light and brand classes are still in `component.css`.
    // `ga: true` — Graphics delivers `background_image`, so the veil it needs is theirs to tune
    // (Chris's ruling of 2026-09-21). Defaulted on: the untouched field has to be the readable one.
    scrim: f.boolean({
      label: 'Fade the background image behind the text',
      group: 'design',
      ga: true,
      default: true,
      help: 'Keeps the closing text readable over a photo. Ignored when no background image is set.',
    }),
  },
})
