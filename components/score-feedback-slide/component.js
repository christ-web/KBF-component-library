KBF.define(function (root, kbf) {
  'use strict';
  var c = kbf.config;

  var wrapper    = root.querySelector('#sf-wrapper');
  var card       = root.querySelector('#sf-card');
  var imageEl    = root.querySelector('#sf-image');
  var titleEl    = root.querySelector('#sf-title');
  var subtitleEl = root.querySelector('#sf-subtitle');
  var messageEl  = root.querySelector('#sf-message');

  // The background is the one thing here that does not depend on the result, so it is set once.
  if (c.background_image) {
    // Only over a photograph — a flat background is a colour the text is already measured against.
    // `!== false` because an instance placed before this field existed has no `scrim` key, and the
    // safe reading of absent is on.
    if (c.scrim !== false) wrapper.classList.add('sf-scrim');
    // Quoted with `"` escaped: a packaged filename with a space in it invalidated this unquoted.
    wrapper.style.backgroundImage =
      'var(--sf-scrim, none), url("' + String(c.background_image).replace(/"/g, '%22') + '")';
  }

  // What this slide says when there is no result to report. Deliberately not authorable: an ID writes
  // the pass and the fail because those are outcomes they have something to say about, and "you have
  // not taken it yet" is not an outcome — it is the absence of one. A field for it would invite copy
  // that contradicts the state, and there is no version of this screen where a learner benefits from a
  // course-specific wording of "nothing to show".
  var PENDING_TITLE = 'No Result Yet';
  var PENDING_MESSAGE =
    'You have not finished the quiz in this module yet. Your score will show here once you do.';

  // `{score}` / `{total}` / `{pct}` against a real result. `score` is null in the two states that have
  // no numbers, and a title written around one of these tokens cannot be rendered there — see
  // `titleFor`, which is where that is handled rather than here, because a sentence with a hole in it
  // is a copy problem and not a substitution problem.
  function tokenize(text, score) {
    if (!score) return String(text || '');
    return String(text || '')
      .replace(/\{score\}/g, String(score.correct))
      .replace(/\{total\}/g, String(score.total))
      .replace(/\{pct\}/g, score.pct + '%');
  }

  var TOKEN = /\{(?:score|total|pct)\}/;

  // The authored title, unless it needs numbers we do not have.
  //
  // This is the prior-pass case: the LMS says the learner passed on an earlier attempt, and that
  // attempt's tally died with its `suspend_data`. The player restates the pass without inventing a
  // score, and so does this — "You scored {score} out of {total}!" would otherwise render as a sentence
  // with holes, or worse, invite a zero. Falling back to the generic default loses the ID's wording and
  // keeps the fact, which is the right way round: the fact is what the learner came for.
  function titleFor(authored, fallback, score) {
    var text = String(authored || '').trim();
    if (!text) return fallback;
    if (!score && TOKEN.test(text)) return fallback;
    return tokenize(text, score);
  }

  // Optional copy, shown only when it survives the same test the title does.
  function bodyFor(authored, score) {
    var text = String(authored || '').trim();
    if (!text) return '';
    if (!score && TOKEN.test(text)) return '';
    return tokenize(text, score);
  }

  function show(el, text) {
    if (!text) {
      el.textContent = '';
      el.style.display = 'none';
      return;
    }
    el.textContent = text;
    el.style.display = '';
  }

  /**
   * Three states, and which one applies is decided by the player, never here.
   *
   *   score present          → the real numbers, and the player's verdict
   *   score null, passed     → the pass, without numbers (a pass from an earlier attempt)
   *   score null, not passed → no result yet
   *
   * The second and third are both "no tally", and they are not interchangeable: showing the fail half
   * to a learner who has not answered anything calls them a failure, and showing "no result" to
   * someone the LMS has already passed tells them their pass is gone. `kbf.modulePassed` is what
   * separates them, and it is the only thing that can — a tally that outlived its attempt is ignored
   * by `moduleScore` in `player.js`, precisely so that this branch is reached cleanly.
   */
  function render(score) {
    var passed = score ? score.passed : kbf.modulePassed === true;
    var pending = !score && !passed;
    var state = pending ? 'pending' : (passed ? 'pass' : 'fail');

    card.className = 'sf-card sf-card--' + state;
    titleEl.className = 'sf-title kbf-display-field sf-title--' + state;

    if (pending) {
      imageEl.style.display = 'none';
      titleEl.textContent = PENDING_TITLE;
      show(subtitleEl, '');
      show(messageEl, PENDING_MESSAGE);
      return;
    }

    // One `<img>`, two possible pictures, so the alt follows the branch the image did — one shared alt
    // would describe the wrong one half the time. Blank stays blank: an illustration of a result the
    // title states in words is decorative.
    var imgSrc = passed ? c.pass_image : c.fail_image;
    var imgAlt = passed ? c.pass_image_alt : c.fail_image_alt;
    if (imgSrc) {
      imageEl.src = String(imgSrc).trim();
      imageEl.alt = imgAlt ? String(imgAlt).trim() : '';
      imageEl.style.display = '';
    } else {
      imageEl.style.display = 'none';
    }

    titleEl.textContent = passed
      ? titleFor(c.pass_title, 'You Passed!', score)
      : titleFor(c.fail_title, 'Try Again', score);

    show(subtitleEl, bodyFor(passed ? c.pass_subtitle : c.fail_subtitle, score));
    show(messageEl, bodyFor(passed ? c.pass_message : c.fail_message, score));
  }

  // Called immediately with whatever is known, and again if the mark lands while this page is open —
  // the quiz and this slide placed together. Everything above is a function of the mark, so there is
  // one paint path rather than a first paint and an update that can drift apart.
  kbf.onScore(render);

  // Nothing here gates navigation: this slide reports a result, it does not ask for anything. It
  // completes on mount so a `lock_next` page carrying it is not a dead end.
  kbf.complete();
});
