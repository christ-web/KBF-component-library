KBF.define(function (root, kbf) {
  'use strict';
  var c = kbf.config;

  var fired = false;
  function fireComplete() {
    if (fired) return;
    fired = true;
    kbf.complete();
  }

  var blocking = !(c.blocking === 'false' || c.blocking === false);

  var SVG_CHECK = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="11" fill="var(--kbf-color-correct, #15803d)"/><path d="M6 11l3.5 3.5L16 7" stroke="var(--kbf-color-on-correct, #ffffff)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var tilesContainer = root.querySelector('#im-tiles');
  var overlay        = root.querySelector('#im-overlay');
  var box            = root.querySelector('#im-box');
  var closeBtn       = root.querySelector('#im-close');
  var bodyEl         = root.querySelector('#im-body');

  var tiles = [];
  for (var i = 1; i <= 3; i++) {
    var title   = c['tile' + i + '_title']   ? String(c['tile' + i + '_title']).trim()   : '';
    var img     = c['tile' + i + '_image']   ? String(c['tile' + i + '_image']).trim()   : '';
    var content = c['tile' + i + '_content'] ? String(c['tile' + i + '_content']).trim() : '';
    var alt     = c['tile' + i + '_image_alt'] ? String(c['tile' + i + '_image_alt']).trim() : '';
    if (!title && !img) continue;
    tiles.push({ title: title, img: img, alt: alt, content: content, opened: false, el: null });
  }

  tiles.forEach(function (tile, idx) {
    var div = document.createElement('div');
    div.className = 'im-tile kbf-tile';
    // `role="listitem"` used to sit here, and it is the whole of what a screen reader announced: a list
    // item, with nothing saying the tile could be opened — while the click and keydown handlers below
    // made it the component's only interaction (WCAG 4.1.2). The container is a named `group` now, so
    // this can be what it behaves like. The `tabindex`, the name and both handlers are what complete
    // the pattern; a `role="button"` without them would be a lie in the other direction.
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', 'Open ' + (tile.title || 'item ' + (idx + 1)));

    var imgWrap = document.createElement('div');
    imgWrap.className = 'im-tile-img-wrap';

    var img = document.createElement('img');
    img.className = 'im-tile-img';
    // The ID's alt text, and `alt=""` when they left it blank. It used to be the tile title, which is
    // the visible `<p>` rendered immediately below — so the title was announced twice and the image
    // never described. A caption beside a picture is exactly the case `alt=""` is for.
    img.alt = tile.alt;
    if (tile.img) img.src = tile.img;
    else img.style.visibility = 'hidden';

    var check = document.createElement('span');
    check.className = 'im-tile-check';
    check.innerHTML = SVG_CHECK;
    check.setAttribute('aria-hidden', 'true');

    imgWrap.appendChild(img);
    imgWrap.appendChild(check);

    var titleEl = document.createElement('p');
    titleEl.className = 'im-tile-title';
    titleEl.textContent = tile.title || '';

    div.appendChild(imgWrap);
    div.appendChild(titleEl);
    tilesContainer.appendChild(div);

    tile.el = div;

    function openModal() {
      // Build body
      bodyEl.innerHTML = '';
      if (tile.img) {
        var mi = document.createElement('img');
        mi.className = 'im-modal-image';
        mi.src = tile.img;
        // Same image, same reasoning: the `<h2>` built just below carries the title.
        mi.alt = tile.alt;
        bodyEl.appendChild(mi);
      }
      if (tile.title) {
        var h = document.createElement('h2');
        h.className = 'im-modal-title';
        h.textContent = tile.title;
        bodyEl.appendChild(h);
      }
      if (tile.content) {
        var p = document.createElement('p');
        p.className = 'im-modal-text';
        p.textContent = tile.content;
        bodyEl.appendChild(p);
      }

      overlay.removeAttribute('hidden');
      overlay.setAttribute('aria-label', tile.title || 'Modal');
      trapFocus(box);
      closeBtn.focus();

      // Mark tile done. Until now this was the class alone: the tick drawn over the tile is
      // `aria-hidden`, and the tile's accessible name stayed "Open X" for ever, so a screen-reader
      // learner had no way to tell a visited tile from an unvisited one — and on a `lock_next` page
      // the visited count is what decides whether Next works. So the state goes into the name (the
      // visible title is still contained in it, WCAG 2.5.3) and the aggregate is announced.
      if (!tile.opened) {
        tile.opened = true;
        div.classList.add('im-tile--done');
        div.setAttribute('aria-label', 'Open ' + (tile.title || 'item ' + (idx + 1)) + ', viewed');

        var viewed = tiles.filter(function (t) { return t.opened; }).length;
        kbf.a11y.announce(
          viewed + ' of ' + tiles.length + ' viewed.'
          + (viewed === tiles.length ? ' All viewed.' : '')
        );

        checkCompletion();
      }
    }

    div.addEventListener('click', openModal);
    div.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(); }
    });
  });

  function checkCompletion() {
    if (!blocking) { fireComplete(); return; }
    if (tiles.every(function (t) { return t.opened; })) fireComplete();
  }

  /* Close */
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });

  var trapHandler = null;
  function closeModal() {
    overlay.setAttribute('hidden', '');
    if (trapHandler) { box.removeEventListener('keydown', trapHandler); trapHandler = null; }
    // Return focus to last opened tile
    var last = tiles.filter(function (t) { return t.opened; }).pop();
    if (last && last.el) last.el.focus();
  }

  var TABBABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  // The trap's stops, in tab order: the container itself when it is tabbable, then its descendants.
  // `querySelectorAll` returns descendants *only*, so the container was left out of its own trap —
  // and `#im-box` is a tab stop (it scrolls, WCAG 2.1.1). On a text-only modal that made the close
  // button both `first` and `last`, so every Tab bounced straight back to it and the scrolling body
  // was unreachable by keyboard: the exact failure the tabindex was added to fix. A `tabindex="0"`
  // element precedes its children in tab order, hence container first.
  function tabbableStops(el) {
    var stops = el.matches(TABBABLE) ? [el] : [];
    return stops.concat(Array.prototype.slice.call(el.querySelectorAll(TABBABLE)));
  }

  function trapFocus(el) {
    if (trapHandler) el.removeEventListener('keydown', trapHandler);
    trapHandler = function (e) {
      if (e.key !== 'Tab') return;
      // Collected on each Tab rather than once when the trap is installed: the modal body is injected
      // afterwards, so a list captured up front would miss everything inside it. An empty list
      // returns early — `first`/`last` would be undefined and `.focus()` would throw.
      var focusable = tabbableStops(el);
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (root.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (root.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    el.addEventListener('keydown', trapHandler);
  }

  if (!blocking) fireComplete();
});
