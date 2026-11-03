KBF.define(function (root, kbf) {
  'use strict';
  var c = kbf.config;

  var fired = false;
  function fireComplete() {
    if (fired) return;
    fired = true;
    kbf.complete();
  }

  var linkEl        = root.querySelector('#bl-link');
  var labelEl       = root.querySelector('#bl-link-label');
  var instructionsEl = root.querySelector('#bl-instructions');
  var statusEl      = root.querySelector('#bl-status');

  // Into the span, not the link. The external-link glyph is a real <svg> child of the <a> now — it
  // used to be a `::after` data URI, which no CSS variable could reach inside to recolour — so
  // writing textContent on the <a> itself would delete it.
  labelEl.textContent = c.text ? String(c.text) : 'Open Link';
  linkEl.href = c.href ? String(c.href) : '#';

  if (c.instructions) {
    instructionsEl.textContent = String(c.instructions);
  } else {
    instructionsEl.textContent = 'Click the link below to continue.';
  }

  linkEl.addEventListener('click', function () {
    linkEl.classList.add('bl-visited');
    if (statusEl) statusEl.textContent = 'Link opened. You may now continue.';
    fireComplete();
  });
});
