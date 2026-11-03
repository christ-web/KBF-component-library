KBF.define(function (root, kbf) {
  'use strict';
  var c = kbf.config;

  function fireComplete() {
    kbf.complete();
  }

  var avatarEl   = root.querySelector('#sp-avatar');
  var usernameEl = root.querySelector('#sp-username');
  var locationEl = root.querySelector('#sp-location');
  var imageWrap  = root.querySelector('#sp-image-wrap');
  var imageEl    = root.querySelector('#sp-image');
  var bodyEl     = root.querySelector('#sp-body');
  var likeEl     = root.querySelector('#sp-like');
  var commentEl  = root.querySelector('#sp-comment');
  var shareEl    = root.querySelector('#sp-share');
  var footerEl   = root.querySelector('#sp-footer');
  var timeEl     = root.querySelector('#sp-time');

  /* Avatar */
  if (c.avatar_url) {
    avatarEl.style.backgroundImage = 'url(' + String(c.avatar_url).trim() + ')';
    avatarEl.classList.add('sp-avatar--has-image');
  }

  /* Username */
  usernameEl.textContent = c.username ? String(c.username).trim() : 'User';

  /* Location */
  if (c.location) {
    locationEl.textContent = String(c.location).trim();
    locationEl.style.display = '';
  }

  /* Post image */
  if (c.post_image) {
    imageEl.src = String(c.post_image).trim();
    imageEl.alt = c.post_image_alt ? String(c.post_image_alt).trim() : '';
    imageWrap.style.display = '';
  }

  /* Action bar */
  likeEl.textContent    = c.like_label    ? String(c.like_label).trim()    : 'Like';
  commentEl.textContent = c.comment_label ? String(c.comment_label).trim() : 'Comment';
  shareEl.textContent   = c.share_label   ? String(c.share_label).trim()   : 'Share';

  /* Body — highlight #hashtags with a span.
     The span carries no `aria-label`. It used to say "hashtag #Foo", which did nothing — ARIA
     prohibits `aria-label` on a role-less `<span>` — and was not worth making work: a screen reader
     already reads the `#`, so the label would only have made every hashtag more verbose. The
     highlight is decorative. */
  var rawBody = c.body ? String(c.body).trim() : '';
  bodyEl.innerHTML = rawBody
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(#\w+)/g, '<span class="sp-hashtag">$1</span>');

  /* Suppress links */
  bodyEl.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); }); });

  /* Timestamp */
  if (c.time_ago) {
    timeEl.textContent = String(c.time_ago).trim();
    footerEl.style.display = '';
  }

  fireComplete();
});
