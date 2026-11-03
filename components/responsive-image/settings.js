// Responsive Image — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Slides & Layout',
  icon: 'image',
  completion: 'auto',
  styleTokens: [
    '--kbf-border-radius',
    '--kbf-color-bg',
    '--kbf-color-muted',
    '--kbf-font-body',
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
  ],

  fields: {
    image_url: f.url({ altField: 'alt', label: 'Primary image', group: 'content', accept: 'image', size: { width: 1800, height: 1350, crop: true, note: 'Shown in a 4:3 frame on landscape screens and cropped to it.' } }),
    image_url_portrait: f.url({
      optional: true, altField: 'alt',
      label: 'Portrait orientation image (optional)',
      group: 'content',
      accept: 'image',
      size: { width: 1200, height: 1600, crop: true, note: 'Shown in a 3:4 frame on portrait screens and cropped to it.' },
    }),
    // One alt for both slots, which is right rather than an oversight: component.js swaps the `src` on a
    // single `<img>` by orientation, so the two files are the same picture cropped differently.
    alt: f.text({ label: 'Image alt text', group: 'content' }),
    caption: f.text({ label: 'Caption (optional)', group: 'content' }),
  },
})
