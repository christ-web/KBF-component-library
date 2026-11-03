KBF.define({ completion: 'auto' }, function (root, kbf) {
  'use strict';
  var c = kbf.config;

  // Strip any HTML wrapper tags — text fields may have been saved with <p> wrappers
  function plainText(s) {
    var d = document.createElement('div');
    d.innerHTML = String(s || '');
    return (d.textContent || d.innerText || '').trim();
  }

  var wrapper    = root.querySelector('#ts-wrapper');
  var titleEl    = root.querySelector('#ts-title');
  var subtitleEl = root.querySelector('#ts-subtitle');

  titleEl.textContent = c.title ? plainText(c.title) : 'Course Title';
  // The series' Title weight, from Series Styles' Typography (Chris, 2026-10-21). Read here rather than in the
  // stylesheet because unset has to mean the look's own weight, which the type role carries and a
  // `var()` fallback cannot name.
  var titleWeight = getComputedStyle(titleEl).getPropertyValue('--kbf-weight-title').trim();
  if (/^[1-9]00$/.test(titleWeight)) titleEl.style.fontWeight = titleWeight;

  if (c.subtitle) {
    subtitleEl.textContent = plainText(c.subtitle);
  } else {
    subtitleEl.style.display = 'none';
  }

  var align = c.align ? String(c.align).toLowerCase().trim() : 'center';
  if (align === 'left')  wrapper.classList.add('ts-align-left');
  if (align === 'right') wrapper.classList.add('ts-align-right');

  // The series' text colours (Chris, 2026-10-21): no per-slide choice, so the dark path, read by everything
  // below, is the only one taken until a choice is ruled back in.
  var textColor = 'dark';

  // Whether this slide's title is light text (Chris, 2026-10-22): the veil over a photo goes the other way —
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
    // Only over a photograph: a flat theme background is a colour the text is
    // already measured against, so veiling it would dim a passing pair for nothing.
    //
    // `!== false` and not a truthiness test — an instance placed before this field existed carries no
    // `scrim` key, and on is the safe reading of absent: no veil over someone's photo is unreadable
    // text, a veil nobody asked for is a paler photo.
    if (c.scrim !== false) {
      var lightText = textColor === 'light' || (textColor === 'dark' && headingIsLight());
      wrapper.classList.add(lightText ? 'ts-scrim-dark' : 'ts-scrim-light');
      if (textColor === 'dark' && !subtitlePicked()) subtitleEl.classList.add('ts-endpoint');
    }
    // Quoted with `"` escaped: the packaged path is `assets/<hash>-<filename>`, and a filename with a
    // space in it invalidated the whole declaration unquoted.
    wrapper.style.backgroundImage =
      'var(--ts-scrim, none), url("' + String(c.background_image).replace(/"/g, '%22') + '")';
  }

  if (textColor === 'light') {
    titleEl.classList.add('ts-color-light');
    subtitleEl.classList.add('ts-color-light');
  } else if (textColor === 'primary') {
    titleEl.classList.add('ts-color-primary');
    subtitleEl.classList.add('ts-color-primary');
  }
});
