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

  var card         = root.querySelector('#fc-card');
  var back         = root.querySelector('#fc-back');
  var frontLabelEl = root.querySelector('#fc-front-label');
  var frontTitleEl = root.querySelector('#fc-front-title');
  var backTitleEl  = root.querySelector('#fc-back-title');
  var backDescEl   = root.querySelector('#fc-back-desc');
  var statusEl     = root.querySelector('#fc-sr-status');

  if (c.front_label) {
    frontLabelEl.textContent = String(c.front_label);
  } else {
    frontLabelEl.style.display = 'none';
  }

  frontTitleEl.textContent = c.front_title ? String(c.front_title) : 'Click to flip';

  if (c.back_title) {
    backTitleEl.textContent = String(c.back_title);
  } else {
    backTitleEl.style.display = 'none';
  }

  backDescEl.textContent = c.back_description ? String(c.back_description) : '';

  var flipped = false;

  function flip() {
    if (flipped) return;
    flipped = true;
    card.classList.add('fc-flipped');
    card.setAttribute('aria-pressed', 'true');
    back.removeAttribute('aria-hidden');
    if (statusEl) statusEl.textContent = 'Card flipped. ' + (c.back_description ? String(c.back_description) : '');
    // The description is what scrolls when the text is long, so that's what takes focus. `back` has
    // no tabindex, so the `back.focus()` this replaces silently did nothing and the overflowing text
    // was unreachable by keyboard (WCAG 2.1.1). Set here rather than in the markup because the back
    // face is `aria-hidden` until the flip, and a focusable element inside an aria-hidden subtree is
    // itself an accessibility failure.
    backDescEl.setAttribute('tabindex', '0');
    backDescEl.focus();
    if (blocking) fireComplete();
  }

  card.addEventListener('click', flip);
  card.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      flip();
    }
  });

  if (!blocking) fireComplete();
});
