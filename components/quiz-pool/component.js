KBF.define(function (root, kbf) {
  'use strict';

  // `kbf.config` arrives already decoded — the runtime reverses the export's answer
  // obfuscation before this factory runs, and drops `_answer_key`. This component used to
  // carry its own `_tttDecode` copy of that; it was dead either way, since the key it looked
  // for is no longer on the config it receives.
  var c = kbf.config;

  var fired = false;
  function fireComplete() {
    if (fired) return;
    fired = true;
    kbf.complete();
  }

  var blocking   = !(c.blocking === 'false' || c.blocking === false);
  var passingPct = parseFloat(c.passing_pct || '80') / 100;

  // What survived from a previous visit. `{ p: 1, c: correct, t: total }` on a pass, and nothing at
  // all on a fail — a learner who didn't pass comes back to a fresh quiz with nothing answered,
  // which is the intended behaviour and not an oversight.
  var prior = kbf.state.load();
  var priorPass = !!(prior && prior.p === 1);
  // A pass the LMS carried into a brand-new attempt, whose `suspend_data` — and so whose tally — is
  // gone. Enough to know they passed, not enough to say what they scored.
  var passedElsewhere = kbf.modulePassed === true && !priorPass;

  var SVG_CORRECT = '<svg width="56" height="56" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="28" fill="var(--kbf-color-correct,#15803d)"/><path d="M16 28l8 8L40 18" stroke="var(--kbf-color-on-correct, #ffffff)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var SVG_WRONG   = '<svg width="56" height="56" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="28" fill="var(--kbf-color-incorrect,#dc2626)"/><path d="M18 18L38 38M38 18L18 38" stroke="var(--kbf-color-on-incorrect, #ffffff)" stroke-width="3.5" stroke-linecap="round"/></svg>';

  /* ---- Build question pool from config ---- */

  function str(v) {
    return v === null || v === undefined ? '' : String(v).trim();
  }

  /**
   * The option list for one question, as `[{ text, correct }]`.
   *
   * `options` — correctness as a flag on the row — is the only shape read. Two earlier shapes used
   * to be accepted here for read-compatibility (flat `a`…`d` keys plus a `correct` letter, and a
   * pre-repeater `q1_*` variant). Both stored the answer at a path the schema doesn't declare, so
   * `secret_paths` never saw it and the preview route served it to the learner in plaintext —
   * a hard violation of CLAUDE.md's answer-key rule. No stored instance used either shape, so they
   * were deleted rather than special-cased into the encoder.
   */
  function readOptions(row) {
    if (!Array.isArray(row.options)) return [];
    var out = [];
    row.options.forEach(function (opt) {
      if (!opt || typeof opt !== 'object') return;
      var text = str(opt.text);
      if (text) out.push({ text: text, correct: opt.correct === true });
    });
    return out;
  }

  /** One question from a row of the `questions` repeater, or null if it isn't answerable. */
  function readQuestion(row) {
    if (!row || typeof row !== 'object') return null;
    var text = str(row.text);
    if (!text) return null;
    var opts = readOptions(row);
    // Two options is the floor for a question to mean anything, and with nothing flagged every
    // attempt would be wrong. Either way the question is skipped rather than shown broken — and if
    // that leaves no questions at all, `total === 0` below fires complete so the learner isn't
    // stranded. The settings panel and the API both refuse to save a list in this state.
    var right = opts.filter(function (o) { return o.correct; }).length;
    if (opts.length < 2 || right === 0) return null;
    // Two or more marked right is a "select all that apply" question (2.3.0, Chris, 2026-10-27).
    return { text: text, opts: opts, multi: right > 1 };
  }

  var rows = Array.isArray(c.questions) ? c.questions : [];
  // Every answerable question written: the pool each attempt is drawn from.
  var pool = [];
  rows.forEach(function (row) {
    var q = readQuestion(row);
    if (q) pool.push(q);
  });

  // How many each learner is given. Blank, or anything that isn't a count smaller than the pool, is
  // all of them — which is every quiz placed before 2.3.0.
  var shown = parseInt(c.questions_shown, 10);
  if (!(shown > 0) || shown > pool.length) shown = pool.length;

  /**
   * A fresh random set for this attempt, kept in the order the questions were written. Drawn again
   * on every retake, so a learner who failed meets a new set rather than the one they just saw.
   */
  function draw() {
    if (shown >= pool.length) return pool.slice();
    var idx = pool.map(function (_, i) { return i; });
    for (var i = idx.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = idx[i]; idx[i] = idx[j]; idx[j] = t;
    }
    return idx.slice(0, shown).sort(function (a, b) { return a - b; }).map(function (i) { return pool[i]; });
  }

  var questions = draw();
  var total   = questions.length;
  var current = 0;
  var score   = 0;
  var dotEls  = [];
  var results = [];
  // The indexes of the chosen options, in option order. A single-answer question holds at most one.
  var selected = [];
  // When the current question went on screen, for the `latency` of its interaction report. Reset by
  // `renderQuestion`, so it measures reading-and-answering one question rather than time in the quiz.
  var shownAt = 0;

  var quizEl      = root.querySelector('#qp-quiz');
  var questionEl  = root.querySelector('#qp-question');
  var instructEl  = root.querySelector('#qp-instructions');
  var optionsEl   = root.querySelector('#qp-options');
  var controlsEl  = root.querySelector('.qp-controls');
  var submitBtn   = root.querySelector('#qp-submit');
  var feedbackEl  = root.querySelector('#qp-feedback');
  var fbIconEl    = root.querySelector('#qp-feedback-icon');
  var fbTextEl    = root.querySelector('#qp-feedback-text');
  var nextBtn     = root.querySelector('#qp-next');
  var progressText = root.querySelector('#qp-progress-text');
  var dotsEl      = root.querySelector('#qp-dots');
  var resultsEl   = root.querySelector('#qp-results');
  var resTitleEl  = root.querySelector('#qp-results-title');
  var resMsgEl    = root.querySelector('#qp-results-message');
  var resIconEl   = root.querySelector('#qp-results-icon');
  var resCard     = root.querySelector('#qp-results-card');
  var retryBtn    = root.querySelector('#qp-retry');

  // Nothing answerable was configured. Reported as a pass with a total of zero rather than staying
  // silent: the module withholds its completion until every scoring quiz reports a pass, so a silent
  // empty quiz would leave the learner unable to finish the module at all.
  if (total === 0) {
    kbf.quiz.score(0, 0, true);
    fireComplete();
    return;
  }

  /* Build progress dots */
  for (var d = 0; d < total; d++) {
    var dot = document.createElement('div');
    dot.className = 'qp-dot';
    dot.setAttribute('title', 'Question ' + (d + 1));
    dotsEl.appendChild(dot);
    dotEls.push(dot);
    results.push(null);
  }

  function updateDots() {
    dotEls.forEach(function (dot, idx) {
      dot.className = 'qp-dot';
      if (idx === current) dot.classList.add('qp-dot--active');
      else if (results[idx] === true)  dot.classList.add('qp-dot--correct');
      else if (results[idx] === false) dot.classList.add('qp-dot--wrong');
    });
    progressText.textContent = (current + 1) + ' / ' + total;
  }

  /**
   * Put the question card behind the feedback panel out of reach, or bring it back.
   *
   * The panel is an overlay — `position: absolute; inset: 0` over `.qp-card` — so the question, the
   * options and the submit button are painted over while it is up and otherwise untouched. Shift+Tab
   * out of the panel used to land on an option nobody can see, and pressing Space there re-answered
   * a question that had already been graded: WCAG 2.4.3 (focus order) and 2.4.7 (focus visible), in
   * the one component whose result is the module's SCORM mark.
   *
   * `inert` is the fix, and the same mechanism `player.js` uses behind its own modals. The tabindex
   * and `disabled` beside it are the fallback for a browser that has not implemented it: an
   * unsupported `inert` is ignored silently rather than throwing, and this package runs on whatever
   * browser the customer's LMS opens it in. Only the covered direction needs those two — the way out
   * of the panel is `renderQuestion`, which rebuilds the options and re-disables submit anyway, or
   * the results screen, which hides the whole card.
   */
  function coverCard(covered) {
    [questionEl, optionsEl, controlsEl].forEach(function (el) {
      if (!el) return;
      if (covered) el.setAttribute('inert', '');
      else el.removeAttribute('inert');
    });
    if (!covered) return;
    optionsEl.querySelectorAll('.qp-option').forEach(function (b) { b.setAttribute('tabindex', '-1'); });
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-disabled', 'true');
  }

  function setSubmittable() {
    var ok = selected.length > 0;
    submitBtn.disabled = !ok;
    submitBtn.setAttribute('aria-disabled', ok ? 'false' : 'true');
  }

  function renderQuestion(idx) {
    var q = questions[idx];
    selected = [];
    setSubmittable();
    feedbackEl.setAttribute('hidden', '');
    coverCard(false);
    optionsEl.innerHTML = '';

    questionEl.textContent = q.text;

    // A "select all that apply" question is a group of checkboxes, each its own tab stop, and says so
    // in words before the options; a single-answer question stays a radio group with one tab stop.
    optionsEl.setAttribute('role', q.multi ? 'group' : 'radiogroup');
    optionsEl.classList.toggle('qp-options--multi', q.multi);
    optionsEl.classList.toggle('kbf-options--multi', q.multi);
    if (instructEl) {
      if (q.multi) {
        instructEl.removeAttribute('hidden');
        optionsEl.setAttribute('aria-describedby', 'qp-instructions');
      } else {
        instructEl.setAttribute('hidden', '');
        optionsEl.removeAttribute('aria-describedby');
      }
    }

    q.opts.forEach(function (opt, optIdx) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'qp-option kbf-option';
      btn.setAttribute('role', q.multi ? 'checkbox' : 'radio');
      btn.setAttribute('aria-checked', 'false');

      var keyBadge = document.createElement('span');
      keyBadge.className = 'qp-option-key kbf-option-key';
      keyBadge.setAttribute('aria-hidden', 'true');
      // From the position, not from anything stored. The list is 2–6 rows, so this never runs past
      // F, and reordering the options relabels them rather than shuffling which one is right.
      keyBadge.textContent = String.fromCharCode(65 + optIdx);

      var label = document.createElement('span');
      label.textContent = opt.text;

      btn.appendChild(keyBadge);
      btn.appendChild(label);
      btn.addEventListener('click', function () {
        if (q.multi) {
          var on = btn.getAttribute('aria-checked') !== 'true';
          btn.setAttribute('aria-checked', on ? 'true' : 'false');
          selected = on ? selected.concat([optIdx]) : selected.filter(function (i) { return i !== optIdx; });
          selected.sort(function (a, b) { return a - b; });
        } else {
          optionsEl.querySelectorAll('.qp-option').forEach(function (b) { b.setAttribute('aria-checked', 'false'); });
          btn.setAttribute('aria-checked', 'true');
          selected = [optIdx];
        }
        setSubmittable();
      });
      optionsEl.appendChild(btn);
    });

    /* Roving tabindex, for a radio group only: checkboxes are each reached with Tab. */
    var opts = optionsEl.querySelectorAll('.qp-option');
    if (q.multi) {
      opts.forEach(function (btn) { btn.setAttribute('tabindex', '0'); });
      updateDots();
      shownAt = Date.now();
      questionEl.focus();
      return;
    }
    opts.forEach(function (btn, i) {
      btn.setAttribute('tabindex', i === 0 ? '0' : '-1');
      btn.addEventListener('keydown', function (e) {
        var dir = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var next = (i + dir + opts.length) % opts.length;
        opts.forEach(function (b, j) { b.setAttribute('tabindex', j === next ? '0' : '-1'); });
        opts[next].focus();
      });
    });

    updateDots();
    shownAt = Date.now();
    questionEl.focus();
  }

  submitBtn.addEventListener('click', function () {
    if (selected.length === 0) return;
    var q = questions[current];
    var right = q.opts.reduce(function (acc, o, i) { if (o.correct) acc.push(i); return acc; }, []);
    // All of them and only them: every right option chosen and nothing else (Knowledge Check's rule).
    // A single-answer question is the same test with one of each. Rows, not letters, so there is
    // nothing to normalise and no way for the answer to name a row that isn't on screen.
    var correct = selected.length === right.length && selected.every(function (i, k) { return i === right[k]; });
    results[current] = correct;
    if (correct) score++;
    updateDots();

    // The per-question record, on its way to `cmi.interactions.*`. Here and not in `renderQuestion`,
    // because this is the first moment the learner has committed to an answer — the call carries the
    // correct option, so anything that ran it earlier would be handing over the answer key.
    kbf.quiz.answered({
      question: q.text,
      options: q.opts.map(function (o) { return o.text; }),
      chosen: selected.slice(),
      right: right,
      correct: correct,
      latency: shownAt ? Date.now() - shownAt : undefined
    });

    fbIconEl.innerHTML = correct ? SVG_CORRECT : SVG_WRONG;
    fbTextEl.textContent = correct ? 'Correct!' : 'Incorrect.';

    var isLast = current === total - 1;
    nextBtn.textContent = isLast ? 'See Results' : 'Next';

    // The tally goes out now, not when the learner reaches the results screen. *See Results* is a
    // narrative step they may never take — closing the tab, or clicking past an unlocked page — and
    // the quiz is already decided, so waiting for the click meant a graded quiz that reported no
    // mark at all. Painting still waits for the click; only the reporting moved.
    if (isLast) reportResult();

    feedbackEl.removeAttribute('hidden');
    feedbackEl.focus();
    // After the focus move, not before: `inert` on the submit button's own ancestor while the click
    // that triggered this still holds focus drops focus to the document body, and a keyboard learner
    // would have to Tab back in from the top of the page to reach *Next*.
    coverCard(true);
  });

  nextBtn.addEventListener('click', function () {
    if (current === total - 1) {
      showResults();
    } else {
      current++;
      renderQuestion(current);
    }
  });

  function tokenize(text, sc, tot) {
    var pct = tot > 0 ? Math.round((sc / tot) * 100) + '%' : '0%';
    return String(text || '')
      .replace(/\{score\}/g, String(sc))
      .replace(/\{total\}/g, String(tot))
      .replace(/\{pct\}/g, pct);
  }

  /**
   * Paint the results screen.
   *
   * `sc` of `null` means "passed, but the tally is no longer known" — a pass the LMS carried into a
   * new attempt. The authored pass copy is skipped there because it is written around {score},
   * {total} and {pct}, and inventing those numbers would misreport the learner's own result to them.
   */
  function paintResults(passed, sc, tot) {
    quizEl.setAttribute('hidden', '');
    resultsEl.removeAttribute('hidden');

    var variant = passed ? 'pass' : 'fail';
    resCard.className = 'qp-results-card qp-results-card--' + variant;
    resIconEl.innerHTML = passed ? SVG_CORRECT : SVG_WRONG;
    resTitleEl.className = 'qp-results-title qp-results-title--' + variant;

    if (passed && sc === null) {
      resTitleEl.textContent = 'You have already passed this quiz.';
      resMsgEl.textContent = 'Your result was recorded when you completed this module.';
    } else {
      resTitleEl.textContent = tokenize(
        passed ? (c.pass_title || 'You passed!') : (c.fail_title || 'Not quite.'),
        sc, tot
      );
      resMsgEl.textContent = tokenize(
        passed ? (c.pass_message || '') : (c.fail_message || ''),
        sc, tot
      );
    }

    // Retake only exists while there is something to retake. Once the passing score is met the quiz
    // is finished for good: there is no route back to the questions, on this visit or any later one.
    if (passed) retryBtn.setAttribute('hidden', '');
    else retryBtn.removeAttribute('hidden');

    resTitleEl.focus();
  }

  /**
   * Tell the player how this attempt at the quiz went. Once per attempt.
   *
   * Called from the submit handler the moment the last answer is graded, and again from
   * `showResults` — the second call is a no-op, and it is there so this still reports if a future
   * edit reaches the results screen by some route other than grading the last question.
   */
  var reported = false;
  function reportResult() {
    if (reported) return;
    reported = true;

    var passed = score / total >= passingPct;

    // Reported on every grading, pass or fail. The player needs the failing attempt too: it is what
    // tells it the mark is final — a failing mark is reported, not withheld — and, separately, that
    // the module is not finished and must still report `incomplete`.
    kbf.quiz.score(score, total, passed);

    // Only a pass is persisted. Saving a failed attempt would bring the learner back to a quiz
    // already marked wrong; saving nothing brings them back to a blank one, which is what a retake
    // means.
    if (passed) kbf.state.save({ p: 1, c: score, t: total });
  }

  function showResults() {
    reportResult();

    var passed = score / total >= passingPct;
    paintResults(passed, score, total);

    // The gate, and deliberately still here rather than alongside the reporting. A `lock_next` page
    // opens when the learner has finished with the component, and reaching the results screen is
    // what finishing looks like — moving this to the grading click would advance the page out from
    // under someone still reading their feedback.
    if (passed || !blocking) fireComplete();
  }

  retryBtn.addEventListener('click', function () {
    current = 0;
    score = 0;
    results.fill(null);
    // A new attempt draws a new set (the count is the same, so the progress dots stand).
    questions = draw();
    // A retake is a new attempt at the quiz and reports its own tally, which overwrites the failing
    // one on the LMS. Without this reset the second attempt would grade silently.
    reported = false;
    quizEl.removeAttribute('hidden');
    resultsEl.setAttribute('hidden', '');
    renderQuestion(0);
  });

  // Already passed — on this attempt or an earlier one. The pass screen is the whole component from
  // here on: no questions, no retake, and nothing the learner can do to lower a mark they've earned.
  if (priorPass || passedElsewhere) {
    if (priorPass) {
      score = Number(prior.c) || 0;
      // A pass recorded against a question list that has since been edited keeps its original total
      // — the learner sat that quiz, not this one. Re-reported so the mark survives even if the
      // player's own copy of it didn't.
      var priorTotal = Number(prior.t) > 0 ? Number(prior.t) : total;
      kbf.quiz.score(score, priorTotal, true);
      paintResults(true, score, priorTotal);
    } else {
      kbf.quiz.score(0, 0, true);
      paintResults(true, null, 0);
    }
    fireComplete();
    return;
  }

  renderQuestion(0);
});
