KBF.define({ completion: 'auto' }, function (root, kbf) {
  'use strict';
  var c = kbf.config;

  var wrapper   = root.querySelector('#csl-wrapper');
  var inner     = root.querySelector('#csl-inner');
  var headingEl = root.querySelector('#csl-heading');
  var bodyEl    = root.querySelector('#csl-body');
  var imageCol  = root.querySelector('#csl-image-col');
  var imageEl   = root.querySelector('#csl-image');

  if (c.heading) headingEl.textContent = String(c.heading);
  else headingEl.style.display = 'none';

  if (c.body) bodyEl.textContent = String(c.body);

  var layout = c.layout ? String(c.layout).toLowerCase().trim() : '';
  var hasImage = c.image_url && String(c.image_url).trim();

  if (!hasImage || layout === 'text-only') {
    inner.classList.add('csl-text-only');
  } else if (layout === 'image-left') {
    inner.classList.add('csl-image-left');
    imageEl.src = String(c.image_url);
    imageEl.alt = c.image_alt ? String(c.image_alt) : '';
  } else if (layout === 'image-top') {
    inner.classList.add('csl-image-top');
    imageEl.src = String(c.image_url);
    imageEl.alt = c.image_alt ? String(c.image_alt) : '';
  } else {
    inner.classList.add('csl-image-right');
    imageEl.src = String(c.image_url);
    imageEl.alt = c.image_alt ? String(c.image_alt) : '';
  }

  if (c.bg_image) {
    // The scrim goes on only when there is a photograph to veil. A flat theme
    // background is a colour KBF already measures against the text on it, so veiling that would dim
    // a pair that passes and darken a slide for nothing.
    //
    // `!== false` and not a truthiness test: an instance placed before this field existed carries no
    // `scrim` key, and on means readable. A missing veil is unreadable text over someone's photo; a
    // veil nobody asked for is a slightly paler photo.
    if (c.scrim !== false) wrapper.classList.add('csl-scrim');
    // Quoted, with any `"` escaped — the path is `assets/<hash>-<filename>` inside the package, and
    // a filename with a space in it silently invalidated the whole declaration unquoted.
    wrapper.style.backgroundImage =
      'var(--csl-scrim, none), url("' + String(c.bg_image).replace(/"/g, '%22') + '")';
  }
});
