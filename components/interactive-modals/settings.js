// Interactive Modals — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Slides & Layout',
  icon: 'mouse-pointer-click',
  completion: 'explicit',
  styleTokens: [
    '--kbf-border-radius',
    '--kbf-color-bg',
    '--kbf-color-border',
    '--kbf-color-correct',
    '--kbf-color-heading',
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
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
  ],

  fields: {
    // Each tile's image is an `<img>` twice over — once in the tile, once at the top of the modal it
    // opens — and until now both took the *tile title* as their alt text. The title is rendered as
    // visible text directly beneath the one and directly beneath the other, so a screen reader heard it
    // twice in both places while the image itself was never described. Graphics now marks each
    // picture Decorative or Contextual (2026-10-02); the words written here are kept either way.
    tile1_image: f.url({ altField: 'tile1_image_alt', label: 'Tile 1 trigger image', group: 'content', accept: 'image', size: { width: 1200, height: 1200, crop: true, note: 'Cropped to a square on the tile, and shown whole when it opens.' } }),
    tile1_image_alt: f.text({
      label: 'Tile 1 image alt text',
      group: 'content',
      help: 'What the picture shows, in a sentence. Graphics decides whether a screen reader reads it.',
    }),
    tile1_title: f.text({ label: 'Tile 1 title', group: 'content' }),
    tile1_content: f.textarea({ label: 'Tile 1 modal body text', group: 'content' }),
    tile2_image: f.url({ optional: true, altField: 'tile2_image_alt', label: 'Tile 2 trigger image (optional)', group: 'content', accept: 'image', size: { width: 1200, height: 1200, crop: true, note: 'Cropped to a square on the tile, and shown whole when it opens.' } }),
    tile2_image_alt: f.text({ label: 'Tile 2 image alt text', group: 'content' }),
    tile2_title: f.text({ label: 'Tile 2 title (optional)', group: 'content' }),
    tile2_content: f.textarea({ label: 'Tile 2 modal body text (optional)', group: 'content' }),
    tile3_image: f.url({ optional: true, altField: 'tile3_image_alt', label: 'Tile 3 trigger image (optional)', group: 'content', accept: 'image', size: { width: 1200, height: 1200, crop: true, note: 'Cropped to a square on the tile, and shown whole when it opens.' } }),
    tile3_image_alt: f.text({ label: 'Tile 3 image alt text', group: 'content' }),
    tile3_title: f.text({ label: 'Tile 3 title (optional)', group: 'content' }),
    tile3_content: f.textarea({ label: 'Tile 3 modal body text (optional)', group: 'content' }),
    // Shown only while the page's Lock Next is on, the one time it does anything (Chris, 2026-10-10):
    // Lock Next holds the page, and this says what this component must see first, or exempts it.
    blocking: f.boolean({
      label: 'Learner must finish this to go on', group: 'content', default: true, whenLocked: true,
      help: 'Holds the page until every tile is opened. Off, these tiles do not hold it.',
    }),
  },
})
