// Content Slide — component settings.
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
    '--kbf-border-radius',
    '--kbf-color-bg',
    '--kbf-color-heading',
    '--kbf-color-text',
    '--kbf-font-body',
    '--kbf-font-heading',
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
    { key: 'design', label: 'Design', owner: 'dev', order: 2 },
  ],

  fields: {
    heading: f.text({ label: 'Heading', group: 'content' }),
    body: f.textarea({ label: 'Body text', group: 'content' }),
    image_url: f.url({ optional: true, altField: 'image_alt', label: 'Image (optional)', group: 'content', accept: 'image', size: { width: 1200, height: 900, crop: true, note: 'Shown in a 4:3 frame and cropped to it.' } }),
    image_alt: f.text({ label: 'Image alt text', group: 'content' }),
    // `bg_image` below stays in the dev-owned Design group and gains no alt field: it is a CSS
    // `background-image` on the wrapper (component.js:37), unlike `image_url`, which is the `<img>` on
    // component.html:11. Left where it is deliberately — moving a field between differently-owned
    // groups is one of the two things `schema_contract_diff` calls a broken contract.
    // `ga: true` — where the picture sits is part of the look, and the look is Graphics' (2026-10-01).
    layout: f.select({
      label: 'Layout',
      group: 'design',
      ga: true,
      options: [{ value: 'text-only', label: 'Text only' }, { value: 'image-right', label: 'Image on the right' }, { value: 'image-left', label: 'Image on the left' }, { value: 'image-top', label: 'Image above the text' }],
    }),
    bg_image: f.url({ optional: true, label: 'Full background image (optional)', group: 'design', accept: 'image', size: { width: 2048, height: 1536, crop: true, note: 'Cropped to fill the page, so keep the subject near the center.' } }),
    // `ga: true` — the Graphic Artist delivers `bg_image` and this is the consequence of it, so it is
    // theirs to tune (Chris's ruling of 2026-09-21). Defaulted on: a photograph with no veil under
    // dark text is the contrast failure the scrim exists to fix, so the safe state is the one an
    // instance gets when nobody has touched the field.
    scrim: f.boolean({
      label: 'Fade the background image behind the text',
      group: 'design',
      ga: true,
      default: true,
      help: 'Keeps the heading and body readable over a photo. Ignored when no background image is set.',
    }),
    // `ga: true` — colour is Graphics' (Chris's ruling of 2026-10-01), set through `PATCH …/ga-design`.
    // No background colour setting (Chris, 2026-10-21): the slide is Page Background from the series' Colors.
  },
})
