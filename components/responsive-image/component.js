KBF.define(function (root, kbf) {
  'use strict';
  var c = kbf.config;

  var picture   = root.querySelector('#ri-picture');
  var imgEl     = root.querySelector('#ri-img');
  var captionEl = root.querySelector('#ri-caption');

  var primaryUrl  = c.image_url          ? String(c.image_url).trim()          : '';
  var portraitUrl = c.image_url_portrait ? String(c.image_url_portrait).trim() : '';

  if (portraitUrl && primaryUrl) {
    // Tells the stylesheet to draw a portrait screen's picture in a 3:4 frame.
    var figureEl = imgEl.closest('figure');
    if (figureEl) figureEl.classList.add('ri-has-portrait');
    var sourcePortrait = document.createElement('source');
    sourcePortrait.media = '(orientation: portrait)';
    sourcePortrait.srcset = portraitUrl;
    picture.insertBefore(sourcePortrait, imgEl);

    var sourceLandscape = document.createElement('source');
    sourceLandscape.media = '(orientation: landscape)';
    sourceLandscape.srcset = primaryUrl;
    picture.insertBefore(sourceLandscape, imgEl);
  }

  imgEl.src = primaryUrl || '';
  imgEl.alt = c.alt ? String(c.alt) : '';

  if (c.caption) {
    captionEl.textContent = String(c.caption);
  } else {
    captionEl.style.display = 'none';
  }

  kbf.complete();
});
