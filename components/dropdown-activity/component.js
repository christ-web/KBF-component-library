KBF.define(function (root, kbf) {
  'use strict';

  var c = kbf.config;

  var fired = false;
  function fireComplete() {
    if (fired) return;
    fired = true;
    kbf.complete();
  }

  var VERDICTS = { right: 1, wrong: 1, neutral: 1 };

  function normalizeVerdict(v) {
    v = v ? String(v).trim().toLowerCase() : '';
    return VERDICTS[v] ? v : 'wrong';
  }

  // Answers arrive as repeater rows: [{ text: 'Report it to IT', verdict: 'right' }, …]. `verdict`
  // is marked `secret` in settings.js, so it travels XOR-encoded in an exported package and the KBF
  // runtime decodes it before this factory runs — nothing here has to know that happened.
  function readOptions(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map(function (row) {
      if (!row || typeof row !== 'object') return null;
      var text = row.text ? String(row.text).trim() : '';
      if (!text) return null;
      return { text: text, type: normalizeVerdict(row.verdict) };
    }).filter(Boolean);
  }

  // Legacy shape: one textarea per question, `Text|right` per line, which put the answer key in
  // plaintext in every exported package. Kept as a read-only fallback so an instance saved before
  // the repeater landed still renders rather than showing an empty activity. Saving from the
  // storyboard writes rows, after which this path is unused.
  function parseLegacyOptions(raw) {
    if (!raw) return [];
    return String(raw).split('\n').map(function (line) {
      line = line.trim();
      if (!line) return null;
      var parts = line.split('|');
      var text = parts[0].trim();
      if (!text) return null;
      return { text: text, type: normalizeVerdict(parts[1]) };
    }).filter(Boolean);
  }

  function optionsFor(n) {
    var rows = readOptions(c['q' + n + '_answers']);
    return rows.length ? rows : parseLegacyOptions(c['q' + n + '_options']);
  }

  var SVG_CORRECT  = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><circle cx="14" cy="14" r="14" fill="var(--kbf-color-correct, #15803d)"/><path d="M8 14L12 18L20 10" stroke="var(--kbf-color-on-correct, #ffffff)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var SVG_INCORRECT = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><circle cx="14" cy="14" r="14" fill="var(--kbf-color-incorrect, #dc2626)"/><path d="M9 9L19 19M19 9L9 19" stroke="var(--kbf-color-on-incorrect, #ffffff)" stroke-width="2.5" stroke-linecap="round"/></svg>';
  // SVG_NEUTRAL uses track colour rather than muted because muted has no derived foreground token.
  var SVG_NEUTRAL  = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><circle cx="14" cy="14" r="14" fill="var(--kbf-color-track, #e2e8f0)"/><path d="M8 14H20" stroke="var(--kbf-color-text, #1e293b)" stroke-width="2.5" stroke-linecap="round"/></svg>';
  var SVG_FB_OK    = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="var(--kbf-color-correct, #15803d)"/><path d="M6 12L10 16L18 8" stroke="var(--kbf-color-on-correct, #ffffff)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var SVG_FB_ERR   = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="var(--kbf-color-incorrect, #dc2626)"/><path d="M8 8L16 16M16 8L8 16" stroke="var(--kbf-color-on-incorrect, #ffffff)" stroke-width="2" stroke-linecap="round"/></svg>';

  var title           = c.title           ? String(c.title).trim()           : 'Dropdown Activity';
  var instructions    = c.instructions    ? String(c.instructions).trim()    : '';
  var submitLabel     = c.submit_label    ? String(c.submit_label).trim()    : 'Submit';
  var correctFeedback = c.correct_feedback   ? String(c.correct_feedback).trim()   : 'Well done! All answers are correct.';
  var incorrectFeedback = c.incorrect_feedback ? String(c.incorrect_feedback).trim() : 'Some answers need review. Please try again.';
  var blocking        = !(c.blocking === 'false' || c.blocking === false);

  var rows      = [];
  var submitted = false;
  // When this attempt started, so each row's reported `latency` measures how long the learner took
  // rather than how long the page has been open. Reset by *Try Again*.
  var attemptStart = Date.now();

  var titleEl        = root.querySelector('#dda-title');
  var instructionsEl = root.querySelector('#dda-instructions');
  var questionsEl    = root.querySelector('#dda-questions');
  var submitBtn      = root.querySelector('#dda-submit-btn');
  var feedbackPanel  = root.querySelector('#dda-feedback');
  var feedbackIconEl = root.querySelector('#dda-feedback-icon');
  var feedbackTextEl = root.querySelector('#dda-feedback-text');
  var tryAgainBtn    = root.querySelector('#dda-try-again-btn');

  if (titleEl) titleEl.textContent = title;
  if (instructionsEl) {
    if (instructions) {
      instructionsEl.textContent = instructions;
    } else {
      instructionsEl.style.display = 'none';
    }
  }
  if (submitBtn) submitBtn.textContent = submitLabel;

  for (var i = 1; i <= 3; i++) {
    var label = c['q' + i + '_label'] ? String(c['q' + i + '_label']).trim() : '';
    if (!label) continue;

    var options = optionsFor(i);
    if (!options.length) continue;

    var li = document.createElement('li');
    li.className = 'dda-row' + (rows.length % 2 === 1 ? ' dda-row--odd' : '');

    var labelEl = document.createElement('label');
    labelEl.className = 'dda-label';
    labelEl.textContent = label;
    var selectId = 'dda-select-' + i;
    labelEl.setAttribute('for', selectId);

    var selectWrap = document.createElement('div');
    selectWrap.className = 'dda-select-wrap';

    var select = document.createElement('select');
    select.className = 'dda-select kbf-field';
    select.id = selectId;
    select.setAttribute('aria-label', label);

    var blankOpt = document.createElement('option');
    blankOpt.value = '';
    blankOpt.textContent = 'Choose an answer…';
    blankOpt.disabled = true;
    blankOpt.selected = true;
    select.appendChild(blankOpt);

    options.forEach(function (opt, idx) {
      var o = document.createElement('option');
      o.value = String(idx);
      o.textContent = opt.text;
      select.appendChild(o);
    });

    var iconEl = document.createElement('span');
    iconEl.className = 'dda-icon';
    iconEl.style.display = 'none';
    iconEl.setAttribute('aria-hidden', 'true');

    selectWrap.appendChild(select);
    selectWrap.appendChild(iconEl);
    li.appendChild(labelEl);
    li.appendChild(selectWrap);
    questionsEl.appendChild(li);

    // `label` is kept because each row is reported to the LMS as its own question, and the label is
    // what was asked. `answeredAt` is when this row was last changed.
    rows.push({ select: select, icon: iconEl, row: li, options: options, label: label, answeredAt: 0 });

    // Wrapped, because `var` in this `for` loop is function-scoped: a closure written straight into
    // the loop body would see the last row from every row's handler.
    (function (r) {
      r.select.addEventListener('change', function () {
        // Per row, not per activity: the learner fills the rows in whatever order they like and
        // submits once, so a single stopwatch would report the same time for all three.
        r.answeredAt = Date.now();
        updateSubmit();
      });
    })(rows[rows.length - 1]);
  }

  function updateSubmit() {
    if (!submitBtn) return;
    var allChosen = rows.every(function (r) { return r.select.value !== ''; });
    submitBtn.disabled = !allChosen || submitted;
    if (!submitBtn.disabled) {
      submitBtn.removeAttribute('aria-disabled');
    } else {
      submitBtn.setAttribute('aria-disabled', 'true');
    }
  }

  updateSubmit();

  if (submitBtn) submitBtn.addEventListener('click', onSubmit);
  if (tryAgainBtn) tryAgainBtn.addEventListener('click', onTryAgain);

  function onSubmit() {
    if (submitted) return;
    submitted = true;
    if (submitBtn) submitBtn.disabled = true;

    var allCorrect = true;

    rows.forEach(function (row) {
      row.select.disabled = true;
      var idx = parseInt(row.select.value, 10);
      var opt = row.options[idx];
      var type = opt ? opt.type : 'wrong';

      // Each dropdown is its own question, so each reports its own `cmi.interactions.*` record —
      // one aggregate record for the activity would say the learner got "it" wrong without saying
      // which of the three they got wrong, which is the only thing worth reading. Reported from
      // here, after the learner has submitted, because the call names the right answer.
      //
      // This is a knowledge check: the player writes `weighting: 0` and it moves neither the mark
      // nor the completion. A `neutral` row is reported as `neutral` rather than as a wrong answer —
      // the author marked it defensible, and SCORM has that word.
      kbf.quiz.answered({
        question: row.label,
        options: row.options.map(function (o) { return o.text; }),
        chosen: isFinite(idx) ? [idx] : [],
        right: row.options.reduce(function (acc, o, i) {
          if (o.type === 'right') acc.push(i);
          return acc;
        }, []),
        correct: type === 'right',
        result: type === 'neutral' ? 'neutral' : undefined,
        latency: row.answeredAt > attemptStart ? row.answeredAt - attemptStart : undefined
      });

      if (type === 'right') {
        row.row.classList.add('dda-row--correct');
        row.icon.innerHTML = SVG_CORRECT;
        row.icon.style.display = '';
      } else if (type === 'neutral') {
        row.row.classList.add('dda-row--neutral');
        row.icon.innerHTML = SVG_NEUTRAL;
        row.icon.style.display = '';
        allCorrect = false;
      } else {
        row.row.classList.add('dda-row--incorrect');
        row.icon.innerHTML = SVG_INCORRECT;
        row.icon.style.display = '';
        allCorrect = false;
      }
    });

    if (feedbackPanel) {
      feedbackPanel.removeAttribute('hidden');
      if (allCorrect) {
        feedbackPanel.classList.add('dda-feedback--correct');
        feedbackPanel.classList.remove('dda-feedback--incorrect');
        if (feedbackIconEl) feedbackIconEl.innerHTML = SVG_FB_OK;
        if (feedbackTextEl) feedbackTextEl.textContent = correctFeedback;
        if (tryAgainBtn) tryAgainBtn.style.display = 'none';
      } else {
        feedbackPanel.classList.add('dda-feedback--incorrect');
        feedbackPanel.classList.remove('dda-feedback--correct');
        if (feedbackIconEl) feedbackIconEl.innerHTML = SVG_FB_ERR;
        if (feedbackTextEl) feedbackTextEl.textContent = incorrectFeedback;
        if (blocking && tryAgainBtn) tryAgainBtn.style.display = '';
      }
      setTimeout(function () { feedbackPanel.focus(); }, 100);
    }

    if (!blocking || allCorrect) {
      fireComplete();
    }
  }

  function onTryAgain() {
    submitted = false;
    attemptStart = Date.now();
    rows.forEach(function (row) {
      row.select.disabled = false;
      row.select.value = '';
      row.answeredAt = 0;
      row.row.classList.remove('dda-row--correct', 'dda-row--incorrect', 'dda-row--neutral');
      row.icon.style.display = 'none';
      row.icon.innerHTML = '';
    });
    if (feedbackPanel) {
      feedbackPanel.setAttribute('hidden', '');
      feedbackPanel.classList.remove('dda-feedback--correct', 'dda-feedback--incorrect');
    }
    if (tryAgainBtn) tryAgainBtn.style.display = 'none';
    updateSubmit();
    if (rows.length > 0) rows[0].select.focus();
  }

});
