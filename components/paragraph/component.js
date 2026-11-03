KBF.define({ completion: 'auto' }, function (root, kbf) {
  'use strict';
  var c = kbf.config;
  // ── The Design group, shared by Heading, Paragraph and List (2026-10-10) ──────────────────────
  // Copied into each of the three, as `title-slide` keeps `plainText` local: a component is one
  // self-contained file the runtime loads, with nothing to import.

  function parse(value) {
    var m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?/i.exec(String(value));
    if (!m) return null;
    return { rgb: [+m[1], +m[2], +m[3]], a: m[4] === undefined ? 1 : +m[4] };
  }
  function luminance(rgb) {
    var c = rgb.map(function (v) { var s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function ratio(a, b) {
    var la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  // The first opaque background at or above `el`, through the shadow root to the page. White when
  // nothing paints one, which is what an unpainted page shows.
  function backgroundOf(el) {
    for (var node = el; node; ) {
      if (node.nodeType === 1) {
        var bg = parse(getComputedStyle(node).backgroundColor);
        if (bg && bg.a >= 0.99) return bg.rgb;
      }
      node = node.parentNode || node.host || null;
    }
    return [255, 255, 255];
  }

  // Whether the box paints a background of its own.
  function filled(el) {
    var bg = parse(getComputedStyle(el).backgroundColor);
    return !!bg && bg.a > 0;
  }

  // Applies the Design group to `box` (the coloured block) and `text` (what carries the type), then
  // holds the text to its contrast floor: 4.5:1, or 3:1 for large text (24px, or 18.66px bold).
  // Below it the colour becomes black or white, whichever passes — Chris's rule of 2026-09-18 — so
  // a pair Graphics picks can never ship unreadable.
  function applyDesign(box, text, c) {
    // The box is Text Box Background from the series' Colors (Chris, 2026-10-21); filled, it gets room
    // around the words.
    if (filled(box)) box.classList.add('kbf-txt-filled');
    if (c.align === 'center' || c.align === 'right' || c.align === 'left') text.style.textAlign = c.align;
    var cs = getComputedStyle(text);
    var fg = parse(cs.color);
    if (!fg) return;
    var px = parseFloat(cs.fontSize) || 16;
    var large = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
    var bg = backgroundOf(box);
    if (ratio(fg.rgb, bg) + 0.005 < (large ? 3 : 4.5)) {
      text.style.color = ratio([0, 0, 0], bg) >= ratio([255, 255, 255], bg) ? '#000000' : '#ffffff';
    }
  }

  var box = root.querySelector('#kbf-txt');
  var para = root.querySelector('#kbf-para');
  para.textContent = c.text ? String(c.text) : '';
  applyDesign(box, para, c);
});
