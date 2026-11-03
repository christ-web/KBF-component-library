KBF.define(function (root, kbf) {
  'use strict';
  var c = kbf.config;

  var fired = false;
  function fireComplete() {
    if (fired) return;
    fired = true;
    kbf.complete();
  }

  var wrapper    = root.querySelector('#fs-wrapper');
  var titleEl    = root.querySelector('#fs-title');
  var subtitleEl = root.querySelector('#fs-subtitle');
  var bodyEl     = root.querySelector('#fs-body');
  var completeBtn = root.querySelector('#fs-complete-btn');

  // The series' text colours (Chris, 2026-10-21): no per-slide choice, so the dark path is the only one taken.
  var textColor = 'dark';
  var colorMod  = textColor === 'light' ? '--light' : textColor === 'primary' ? '--primary' : '';
  // Explicit "Dark text" is a choice that stands on the heading band; unset takes the band's ink.
  var titleMod  = colorMod;

  // Whether the slide's title is light text (Chris, 2026-10-22): the veil over a photo goes the other way —
  // a dark veil under light words, a light one under dark. Read as painted through a probe, because
  // Title/Final Heading may be unset and follow Heading Text. A colour the browser reports in a form this
  // cannot read (an `oklch()` pick) counts as dark, which is the veil this slide always used.
  function headingIsLight() {
    var probe = document.createElement('span');
    probe.style.color = 'var(--kbf-color-title-heading, var(--kbf-color-heading, #0f172a))';
    wrapper.appendChild(probe);
    var m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(getComputedStyle(probe).color);
    wrapper.removeChild(probe);
    if (!m) return false;
    var lin = [m[1], m[2], m[3]].map(function (v) {
      var s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    // 0.179 is where black and white tie; above it a colour is read better on black, so it is light.
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2] > 0.179;
  }
  // Title/Final Subtitle unset: over a veil the subtitle takes the black-or-white endpoint, because Muted
  // Text's grey fails on either. A picked colour stands, and the Colors panel measures it there.
  function subtitlePicked() {
    return getComputedStyle(wrapper).getPropertyValue('--kbf-color-title-muted').trim() !== '';
  }

  if (c.background_image) {
    // Only over a photograph — a flat background is a colour the text is already measured against.
    // `!== false` because an instance placed before this field existed has no `scrim` key, and the
    // safe reading of absent is on.
    if (c.scrim !== false) {
      var lightText = textColor === 'light' || (textColor === 'dark' && headingIsLight());
      wrapper.classList.add(lightText ? 'fs-scrim-dark' : 'fs-scrim-light');
      if (textColor === 'dark' && !subtitlePicked()) subtitleEl.classList.add('fs-endpoint');
    }
    // Quoted with `"` escaped: a packaged filename with a space in it invalidated this unquoted.
    wrapper.style.backgroundImage =
      'var(--fs-scrim, none), url("' + String(c.background_image).replace(/"/g, '%22') + '")';
  }

  titleEl.textContent = c.title ? String(c.title).trim() : 'Course Complete';
  // The series' Title weight, from Series Styles' Typography (Chris, 2026-10-21). Read here rather than in the
  // stylesheet because unset has to mean the look's own weight, which the type role carries and a
  // `var()` fallback cannot name.
  var titleWeight = getComputedStyle(titleEl).getPropertyValue('--kbf-weight-title').trim();
  if (/^[1-9]00$/.test(titleWeight)) titleEl.style.fontWeight = titleWeight;
  if (titleMod) titleEl.classList.add('fs-title' + titleMod);

  if (c.subtitle) {
    subtitleEl.textContent = String(c.subtitle).trim();
    subtitleEl.style.display = '';
    if (colorMod) subtitleEl.classList.add('fs-subtitle' + colorMod);
  }

  if (c.body) {
    bodyEl.textContent = String(c.body).trim();
    bodyEl.style.display = '';
    if (colorMod) bodyEl.classList.add('fs-body' + colorMod);
  }

  if (colorMod === '--light') completeBtn.classList.add('fs-complete-btn--light');

  completeBtn.addEventListener('click', function () {
    completeBtn.disabled = true;
    completeBtn.style.opacity = '0.6';
    fireComplete();
    /* Signal the parent player to attempt SCORM termination */
    kbf.terminate();
  });

  /* Fire complete immediately — this page was reached, training is done */
  fireComplete();
});
