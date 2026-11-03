KBF.define(function (root, kbf) {
  var c = kbf.config;
  var q = function (sel) { return root.querySelector(sel); };

  function str(v) {
    return v === null || v === undefined ? '' : String(v).trim();
  }

  /**
   * The pre-repeater shape: `choice_a`…`choice_d` plus a `correct` string of letters such as
   * `a, c`. Read only when `choices` is empty, so an instance configured before the repeater
   * landed still renders rather than showing a learner an unanswerable question they can't
   * advance past.
   */
  function legacyChoices() {
    var flagged = str(c.correct).toLowerCase().split(',').map(function (k) { return k.trim(); });
    var out = [];
    ['a', 'b', 'c', 'd'].forEach(function (k) {
      var text = str(c['choice_' + k]);
      if (!text) return;
      out.push({ key: k, text: text, correct: flagged.indexOf(k) !== -1 });
    });
    return out;
  }

  var rows = Array.isArray(c.choices) ? c.choices : [];
  var choices = [];
  rows.forEach(function (row, i) {
    if (!row || typeof row !== 'object') return;
    var text = str(row.text);
    if (!text) return;
    // The row's own index is the choice key. It used to be the letter suffix of a field name,
    // which is what capped the component at four choices.
    choices.push({ key: String(i), text: text, correct: row.correct === true });
  });
  if (!choices.length) choices = legacyChoices();

  // The letter badge is presentation, derived from position — so it stays a, b, c… after a row
  // is deleted, where before it was the choice's identity and left a gap.
  choices.forEach(function (choice, i) {
    choice.label = String.fromCharCode(97 + i);
  });

  var correctCount = choices.filter(function (ch) { return ch.correct; }).length;
  var isMulti = correctCount > 1;

  if (c.question) q('.quiz-question').innerHTML = c.question;

  var ul = q('.quiz-choices');
  ul.innerHTML = '';

  // The choices are the only way to answer the question, and they used to be plain `<li>`s with a
  // click listener: no role, no tab stop, no `aria-checked`. A keyboard-only or screen-reader
  // learner could not answer at all — and on a `lock_next` page that is not a degraded experience,
  // it is a learner who cannot leave the page. WCAG 2.1.1 (Keyboard) and 4.1.2 (Name, Role, Value).
  //
  // Single-answer follows the ARIA radiogroup pattern: one tab stop for the group, arrow keys to
  // move, Space or Enter to choose. Multi-answer is a group of checkboxes, each its own tab stop,
  // because that is what a screen reader announces correctly for "choose all that apply".
  ul.setAttribute('role', isMulti ? 'group' : 'radiogroup');
  var questionText = q('.quiz-question').textContent.trim();
  if (questionText) ul.setAttribute('aria-label', questionText);

  var items = [];

  function paint(li, on) {
    var indicator = li.querySelector('.choice-indicator');
    li.classList.toggle('selected', on);
    li.setAttribute('aria-checked', on ? 'true' : 'false');
    indicator.innerHTML = isMulti ? (on ? '&#9745;' : '&#9744;') : (on ? '&#9679;' : '&#9675;');
  }

  function choose(li) {
    if (isMulti) {
      paint(li, !li.classList.contains('selected'));
      return;
    }
    items.forEach(function (el) {
      paint(el, el === li);
      // Roving tabindex: the group keeps a single tab stop, and it follows the chosen option, so
      // tabbing back into the question lands on the answer rather than the first choice.
      el.tabIndex = el === li ? 0 : -1;
    });
    li.focus();
  }

  function move(from, delta) {
    var next = items[(items.indexOf(from) + delta + items.length) % items.length];
    choose(next);
  }

  choices.forEach(function (choice, index) {
    var li = document.createElement('li');
    li.className = 'kbf-option' + (isMulti ? ' kbf-option--multi' : '');
    li.dataset.key = choice.key;
    li.setAttribute('role', isMulti ? 'checkbox' : 'radio');
    li.setAttribute('aria-checked', 'false');
    // Radios share one tab stop until something is chosen; checkboxes each get their own.
    li.tabIndex = isMulti || index === 0 ? 0 : -1;
    var indicator = document.createElement('span');
    indicator.className = 'choice-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    indicator.innerHTML = isMulti ? '&#9744;' : '&#9675;';
    li.appendChild(indicator);
    var keySpan = document.createElement('span');
    keySpan.className = 'key kbf-option-key';
    keySpan.setAttribute('aria-hidden', 'true');  // the letter is a visual cue, not part of the answer
    keySpan.textContent = choice.label || '';
    li.appendChild(keySpan);
    var textSpan = document.createElement('span');
    textSpan.className = 'choice-text';
    textSpan.textContent = choice.text;
    li.appendChild(textSpan);
    li.addEventListener('click', function () { choose(li); });
    li.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();  // Space would scroll the page out from under the learner
        choose(li);
      } else if (!isMulti && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) {
        e.preventDefault();
        move(li, 1);
      } else if (!isMulti && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')) {
        e.preventDefault();
        move(li, -1);
      }
    });
    items.push(li);
    ul.appendChild(li);
  });

  // Feedback appeared silently: a sighted learner sees "Correct!", a screen-reader learner is told
  // nothing at all and has no way to know whether the answer was accepted.
  var feedback = q('.quiz-feedback');
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');

  // For the `latency` on each reported answer, and reset after each one so it measures the attempt
  // rather than the time since the page opened — this question can be answered more than once.
  var attemptStart = Date.now();
  // The last selection reported, so a learner double-clicking Submit doesn't file the same answer
  // twice. A genuine second attempt with a different selection is a different answer and is reported.
  var lastReported = null;

  q('.quiz-btn').addEventListener('click', function () {
    var selected = Array.from(ul.querySelectorAll('li.selected')).map(function (el) { return el.dataset.key; });
    var fb = q('.quiz-feedback');
    if (!selected.length) {
      fb.className = 'quiz-feedback incorrect';
      fb.innerHTML = 'Please select an answer.';
      fb.classList.remove('hidden');
      return;
    }
    var isCorrect = selected.length === correctCount && selected.every(function (key) {
      return choices.some(function (ch) { return ch.key === key && ch.correct; });
    });

    // Reported to the LMS as one `cmi.interactions.*` record, from here — after the learner has
    // committed — because the call names the correct choices. A knowledge check is not the module's
    // mark, and the player says so by writing `weighting: 0`; it is reported anyway because where
    // learners go wrong on the way through is exactly what an ID wants out of a report.
    var fingerprint = selected.slice().sort().join(',');
    if (fingerprint !== lastReported) {
      lastReported = fingerprint;
      kbf.quiz.answered({
        question: questionText,
        options: choices.map(function (ch) { return ch.text; }),
        chosen: choices.reduce(function (acc, ch, i) {
          if (selected.indexOf(ch.key) !== -1) acc.push(i);
          return acc;
        }, []),
        right: choices.reduce(function (acc, ch, i) { if (ch.correct) acc.push(i); return acc; }, []),
        // The component's own verdict. "All of them and only them" for a multi-answer question is this
        // component's rule, not the player's, and the player must not re-derive it.
        correct: isCorrect,
        latency: Date.now() - attemptStart
      });
      attemptStart = Date.now();
    }

    fb.className = 'quiz-feedback ' + (isCorrect ? 'correct' : 'incorrect');
    fb.innerHTML = isCorrect ? (c.feedback_correct || '&#10003; Correct!') : (c.feedback_incorrect || '&#10007; Not quite. Try again.');
    fb.classList.remove('hidden');
    // `kbf.complete()` rather than a bare `parent.postMessage` — the runtime attaches the
    // instance id, which is what lets a page with two components gate navigation on the right
    // one. The raw message carried no id at all.
    if (isCorrect) kbf.complete();
  });
});
