// Reveal Card: the KBF starter component.
//
// KBF loads this file once per page and calls the function you pass to `KBF.define` once for every
// place the component appears on that page. Keep it to this one file: no `import`, no build step,
// no libraries, and no network requests. A finished course runs inside a customer's learning system
// (LMS) with no route back to KBF or to the internet.
//
//   root  the component's shadow root. Find your elements through it (`root.querySelector`), never
//         through `document`, which can't see inside it.
//   kbf   everything the platform offers. This file uses each part a display component needs:
//           kbf.config         the settings, filled in (defaults from settings.js, then what was typed)
//           kbf.state          remember where the learner was, so a resume picks up from there
//           kbf.complete()     tell KBF the learner has finished this component
//
// The first argument repeats `completion` from settings.js. Keep the two the same.
KBF.define({ completion: 'explicit' }, function (root, kbf) {
  'use strict';
  var c = kbf.config;

  var card = root.querySelector('#rc');
  var media = root.querySelector('#rc-media');
  var img = root.querySelector('#rc-img');
  var heading = root.querySelector('#rc-heading');
  var intro = root.querySelector('#rc-text');
  var toggle = root.querySelector('#rc-toggle');
  var reveal = root.querySelector('#rc-reveal');
  var revealText = root.querySelector('#rc-reveal-text');

  // ── Settings → page ─────────────────────────────────────────────────────────────────────────
  // Always `textContent`, never `innerHTML`: the words are typed by people, and `textContent` shows
  // exactly what they typed and can never run as code.
  heading.textContent = c.heading ? String(c.heading) : '';
  revealText.textContent = c.reveal_text ? String(c.reveal_text) : '';
  if (c.intro) intro.textContent = String(c.intro);
  else intro.hidden = true;

  // An image slot holds a URL (or nothing). Its description is the alt text, already emptied by KBF
  // if Graphics marked the picture decorative, so use it as given.
  if (c.image) {
    img.src = String(c.image);
    img.alt = c.image_alt ? String(c.image_alt) : '';
    media.hidden = false;
    card.setAttribute('data-image-side', c.image_side === 'right' ? 'right' : 'left');
  }

  var label = c.button_label ? String(c.button_label) : 'Show more';
  var allowHide = c.allow_hide !== false;

  // ── State: resume where the learner left off ────────────────────────────────────────────────
  // `kbf.state.load()` returns what this component last saved, or `null` on a first visit. Save
  // only small, plain data (it travels inside the learner's saved progress), and never anything
  // the learner shouldn't be able to read, like a quiz's answers.
  var saved = kbf.state.load() || {};
  var seen = saved.seen === true;   // has the learner opened it at least once?
  var open = saved.open === true;   // is it open right now?

  function render() {
    reveal.hidden = !open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.textContent = open ? 'Hide' : label;
    // Once shown with hiding turned off, there's nothing left to press, so the button goes. Focus
    // moves to the text first, so a keyboard user isn't left on an element that no longer exists.
    if (open && !allowHide && !toggle.hidden) {
      reveal.setAttribute('tabindex', '-1');
      reveal.focus();
      toggle.hidden = true;
    }
  }

  toggle.addEventListener('click', function () {
    open = allowHide ? !open : true;
    if (open) seen = true;
    kbf.state.save({ seen: seen, open: open });
    render();
    // ── Completion ──────────────────────────────────────────────────────────────────────────
    // Finishing this component means having seen the text once. Calling `complete()` more than
    // once is harmless (KBF counts it once), so there's no need to track it yourself.
    if (seen) kbf.complete();
  });

  // A learner who already saw it on an earlier visit has already finished it.
  if (seen) kbf.complete();

  // On a resume with hiding off, show the text without moving focus: nobody has pressed anything.
  if (open && !allowHide) {
    reveal.hidden = false;
    toggle.hidden = true;
  } else {
    render();
  }
});
