KBF.define(function (root, kbf) {
  'use strict';

  // `kbf.config` arrives already decoded — the runtime reverses the export's answer obfuscation
  // and drops `_answer_key` before this factory runs. This component used to carry its own
  // `_tttDecode` copy of that, which had been dead since the runtime took the job over.
  var c = kbf.config;

  var question          = c.question           || 'No question provided.';
  var imageUrl          = c.image              || '';
  var correctFeedback   = c.correct_feedback   || 'Correct!';
  var incorrectFeedback = c.incorrect_feedback || 'That is not correct. Please try again.';
  var blocking          = !(c.blocking === 'false' || c.blocking === false);

  function str(v) {
    return v === null || v === undefined ? '' : String(v).trim();
  }

  /**
   * The choices as `[{ text, correct }]`.
   *
   * An `options` list carrying its own flag is the only shape read. The v1 shape —
   * `option_a`…`option_d` plus a top-level `correct` letter — used to be accepted here for
   * read-compatibility, but it stored the answer at a path the schema doesn't declare, so
   * `secret_paths` never saw it and the preview route served it to the learner in plaintext,
   * violating CLAUDE.md's answer-key rule. No stored instance used it, so it was deleted rather
   * than special-cased into the encoder.
   */
  function readOptions() {
    if (!Array.isArray(c.options)) return [];
    var out = [];
    c.options.forEach(function (opt) {
      if (!opt || typeof opt !== 'object') return;
      var text = str(opt.text);
      if (text) out.push({ text: text, correct: opt.correct === true });
    });
    return out;
  }

  var rawOptions = readOptions();

  var fired = false;
  function fireComplete() {
    if (fired) return;
    fired = true;
    kbf.complete();
  }

  var ICON_CHECK_LG = [
    '<svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
    '<circle cx="26" cy="26" r="25" fill="currentColor"/>',
    '<path d="M14 27L22 35L38 17" stroke="var(--kbf-color-on-correct, #ffffff)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    '</svg>'
  ].join('');

  var ICON_X_LG = [
    '<svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
    '<circle cx="26" cy="26" r="25" fill="currentColor"/>',
    '<path d="M18 18L34 34M34 18L18 34" stroke="var(--kbf-color-on-incorrect, #ffffff)" stroke-width="4" stroke-linecap="round"/>',
    '</svg>'
  ].join('');

  var ICON_CHECK_SM = [
    '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">',
    '<path d="M4 10L8 14L16 6" stroke="var(--kbf-color-on-correct, #ffffff)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
    '</svg>'
  ].join('');

  var ICON_X_SM = [
    '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">',
    '<path d="M6 6L14 14M14 6L6 14" stroke="var(--kbf-color-on-incorrect, #ffffff)" stroke-width="2.5" stroke-linecap="round"/>',
    '</svg>'
  ].join('');

  // The chosen option's position in `rawOptions`, `-1` for none. An index rather than a letter, and
  // `-1` rather than `null`, because option 0 is a legitimate choice and would test as falsy.
  var selectedIndex = -1;
  var submitted     = false;
  // When this attempt started, for the `latency` on the reported answer. Reset by *Try Again*, so a
  // second attempt reports how long *it* took rather than the time since the page opened.
  var attemptStart  = Date.now();

  var questionEl       = root.querySelector('#mcq-question');
  var imageWrap        = root.querySelector('#mcq-image-wrap');
  var imageEl          = root.querySelector('#mcq-image');
  var optionsContainer = root.querySelector('#mcq-options');
  var submitBtn        = root.querySelector('#mcq-submit');
  var body             = root.querySelector('#mcq-body');
  var feedbackEl       = root.querySelector('#mcq-feedback');
  var feedbackIconEl   = root.querySelector('#mcq-feedback-icon');
  var feedbackTitleEl  = root.querySelector('#mcq-feedback-title');
  var feedbackMsgEl    = root.querySelector('#mcq-feedback-message');
  var feedbackCtrlsEl  = root.querySelector('#mcq-feedback-controls');
  var tryAgainBtn      = root.querySelector('#mcq-try-again');

  questionEl.textContent = question;

  // A question with fewer than two choices, or with none of them flagged, can't be answered — and
  // with `blocking` on it would strand the learner on this page with no way forward, so complete
  // fires immediately. The settings panel and the API both refuse to save an option list in that
  // state; this covers a config that reached the DB some other way.
  if (rawOptions.length < 2 || !rawOptions.some(function (o) { return o.correct; })) {
    fireComplete();
  }

  if (imageUrl) {
    imageEl.src = imageUrl;
    // Was hardcoded `''`. A header image on a question is very often *part* of the question — the
    // phishing email the learner is being asked to judge — and an empty alt made those questions
    // unanswerable without sight. Blank still means decorative, but now that is the ID's decision.
    imageEl.alt = c.image_alt ? String(c.image_alt).trim() : '';
    imageWrap.style.display = '';
  } else {
    imageWrap.style.display = 'none';
  }

  rawOptions.forEach(function (opt, idx) {
    var div = document.createElement('div');
    div.className = 'mcq-option';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mcq-option-btn kbf-option';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');
    btn.id = 'mcq-option-' + idx;
    btn.setAttribute('tabindex', idx === 0 ? '0' : '-1');

    var indicator = document.createElement('span');
    indicator.className = 'mcq-option-indicator kbf-option-key';
    indicator.setAttribute('aria-hidden', 'true');
    // A letter, as in every quiz: the badge fills when chosen, and a letter keeps it a badge rather than
    // a dot whose only change is its colour. Restored on a retry, after a tick or cross replaced it.
    indicator.textContent = String.fromCharCode(65 + idx);

    var label = document.createElement('span');
    label.className = 'mcq-option-label';
    label.textContent = opt.text;

    btn.appendChild(indicator);
    btn.appendChild(label);
    div.appendChild(btn);
    optionsContainer.appendChild(div);

    btn.addEventListener('click', function () {
      if (submitted) return;
      selectOption(idx);
    });

    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        moveFocus(idx, 1);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        moveFocus(idx, -1);
      }
    });
  });

  function optionBtn(index) {
    return root.querySelector('#mcq-option-' + index);
  }

  function moveFocus(from, direction) {
    var next = (from + direction + rawOptions.length) % rawOptions.length;
    var nextBtn = optionBtn(next);
    if (nextBtn) nextBtn.focus();
  }

  function selectOption(index) {
    rawOptions.forEach(function (_o, i) {
      var b = optionBtn(i);
      if (!b) return;
      b.setAttribute('aria-checked', 'false');
      b.setAttribute('tabindex', '-1');
      b.classList.remove('mcq-selected');
    });

    selectedIndex = index;
    var btn = optionBtn(index);
    if (btn) {
      btn.setAttribute('aria-checked', 'true');
      btn.setAttribute('tabindex', '0');
      btn.classList.add('mcq-selected');
    }

    submitBtn.disabled = false;
    submitBtn.removeAttribute('aria-disabled');
  }

  submitBtn.addEventListener('click', function () {
    if (selectedIndex < 0 || submitted) return;
    submitted = true;
    submitBtn.disabled = true;

    // "Is the row the learner picked the flagged one" — no letter comparison, so there is nothing
    // to normalise and no way for the answer to name a choice that isn't on screen.
    var isCorrect = rawOptions[selectedIndex].correct === true;

    // One `cmi.interactions.*` record, from here — after the learner has committed — because the call
    // names the correct option. This is a knowledge check, so the player reports it with `weighting: 0`
    // and it moves neither the mark nor the completion; it is reported anyway because a report of where
    // learners go wrong on the way through is the whole reason the element exists.
    kbf.quiz.answered({
      question: question,
      options: rawOptions.map(function (o) { return o.text; }),
      chosen: [selectedIndex],
      right: rawOptions.reduce(function (acc, o, i) { if (o.correct) acc.push(i); return acc; }, []),
      correct: isCorrect,
      latency: Date.now() - attemptStart
    });

    rawOptions.forEach(function (_o, i) {
      var b   = optionBtn(i);
      var ind = b ? b.querySelector('.mcq-option-indicator') : null;
      if (!b) return;
      b.disabled = true;
      if (i === selectedIndex) {
        if (isCorrect) {
          b.classList.add('mcq-correct', 'kbf-option--correct');
          if (ind) ind.innerHTML = ICON_CHECK_SM;
        } else {
          b.classList.add('mcq-wrong', 'kbf-option--incorrect');
          if (ind) ind.innerHTML = ICON_X_SM;
        }
      }
    });

    if (!blocking || isCorrect) {
      fireComplete();
    }

    showFeedback(isCorrect);
  });

  function showFeedback(isCorrect) {
    body.classList.add('mcq-showing-feedback');

    if (isCorrect) {
      feedbackIconEl.innerHTML = ICON_CHECK_LG;
      feedbackIconEl.style.color = 'var(--kbf-color-correct, #15803d)';
      feedbackTitleEl.textContent = 'Correct!';
      feedbackTitleEl.className   = 'mcq-feedback-title mcq-title-correct';
      feedbackMsgEl.textContent   = correctFeedback;
      feedbackCtrlsEl.style.display = 'none';
    } else {
      feedbackIconEl.innerHTML = ICON_X_LG;
      feedbackIconEl.style.color = 'var(--kbf-color-incorrect, #dc2626)';
      feedbackTitleEl.textContent = 'Incorrect';
      feedbackTitleEl.className   = 'mcq-feedback-title mcq-title-incorrect';
      feedbackMsgEl.textContent   = incorrectFeedback;
      feedbackCtrlsEl.style.display = '';
    }

    feedbackEl.hidden = false;
    feedbackEl.focus();
  }

  tryAgainBtn.addEventListener('click', resetQuiz);

  function resetQuiz() {
    submitted     = false;
    selectedIndex = -1;
    attemptStart  = Date.now();

    rawOptions.forEach(function (_o, idx) {
      var b   = optionBtn(idx);
      var ind = b ? b.querySelector('.mcq-option-indicator') : null;
      if (!b) return;
      b.disabled = false;
      b.setAttribute('aria-checked', 'false');
      b.setAttribute('tabindex', idx === 0 ? '0' : '-1');
      b.classList.remove('mcq-selected', 'mcq-correct', 'mcq-wrong', 'kbf-option--correct', 'kbf-option--incorrect');
      if (ind) ind.textContent = String.fromCharCode(65 + idx);
    });

    feedbackEl.hidden = true;
    body.classList.remove('mcq-showing-feedback');

    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-disabled', 'true');

    questionEl.focus();
  }

});
