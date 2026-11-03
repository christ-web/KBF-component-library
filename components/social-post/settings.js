// Social Post — component settings.
//
// Generated from the v1 schema by `bin/scaffold-settings.mjs`, then edited by hand.
// `schema.json` beside this file is compiled output — edit this, then run:
//     node backend/bin/kbf-settings.mjs
import { defineSettings, f } from '../_sdk/index.js'

export default defineSettings({
  category: 'Interactives',
  icon: 'share-2',
  completion: 'explicit',
  styleTokens: [
    '--kbf-color-bg',
    '--kbf-color-muted',
    '--kbf-color-primary',
    '--kbf-color-text',
    '--kbf-font-body',
  ],

  groups: [
    { key: 'content', label: 'Content', owner: 'id', order: 0 },
  ],

  fields: {
    // The avatar gets no alt field — component.js:23 paints it as a CSS `background-image` and the
    // username beside it names the poster. The post image does, and already had one.
    avatar_url: f.url({ optional: true, label: 'Profile avatar image (optional)', group: 'content', accept: 'image', size: { width: 200, height: 200, crop: true, note: 'Shown as a small circle.' } }),
    username: f.text({ label: 'Display name / username', group: 'content' }),
    location: f.text({ label: 'Location tag (optional)', group: 'content' }),
    post_image: f.url({ optional: true, altField: 'post_image_alt', label: 'Post image (optional)', group: 'content', accept: 'image', size: { width: 900, height: 675, crop: true, note: 'Shown in a 4:3 frame and cropped to it.' } }),
    post_image_alt: f.text({ label: 'Post image alt text', group: 'content' }),
    body: f.textarea({ label: 'Post body text', group: 'content' }),
    like_label: f.text({ label: 'Like button label (default: Like)', group: 'content' }),
    comment_label: f.text({ label: 'Comment button label (default: Comment)', group: 'content' }),
    share_label: f.text({ label: 'Share button label (default: Share)', group: 'content' }),
    time_ago: f.text({ label: 'Timestamp label (e.g. \'2 hours ago\')', group: 'content' }),
  },
})
