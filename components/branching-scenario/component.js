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

  var SVG_PASS = '<svg width="60" height="60" viewBox="0 0 60 60" fill="none"><circle cx="30" cy="30" r="30" fill="var(--kbf-color-correct,#15803d)"/><path d="M17 30l9 9L43 20" stroke="var(--kbf-color-on-correct, #ffffff)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var SVG_FAIL = '<svg width="60" height="60" viewBox="0 0 60 60" fill="none"><circle cx="30" cy="30" r="30" fill="var(--kbf-color-incorrect,#dc2626)"/><path d="M20 20L40 40M40 20L20 40" stroke="var(--kbf-color-on-incorrect, #ffffff)" stroke-width="3.5" stroke-linecap="round"/></svg>';

  var stepEl        = root.querySelector('#bs-step');
  var outcomeEl     = root.querySelector('#bs-outcome');
  var breadcrumbEl  = root.querySelector('#bs-breadcrumb');
  var situationEl   = root.querySelector('#bs-situation');
  var choicesEl     = root.querySelector('#bs-choices');
  var outcomeCard   = root.querySelector('#bs-outcome-card');
  var outcomeIcon   = root.querySelector('#bs-outcome-icon');
  var outcomeTitleEl = root.querySelector('#bs-outcome-title');
  var outcomeMsgEl  = root.querySelector('#bs-outcome-message');
  var retryBtn      = root.querySelector('#bs-retry-btn');

  /* Build step data from config */
  function getStep(n) {
    var situation = c['step' + n + '_situation'] ? String(c['step' + n + '_situation']).trim() : '';
    if (!situation) return null;
    var choices = [];
    for (var i = 0; i < 3; i++) {
      var key  = ['a','b','c'][i];
      var text = c['step' + n + '_choice_' + key] ? String(c['step' + n + '_choice_' + key]).trim() : '';
      var next = c['step' + n + '_' + key + '_next'] ? String(c['step' + n + '_' + key + '_next']).trim().toLowerCase() : '';
      if (text && next) choices.push({ key: key, text: text, next: next });
    }
    return choices.length >= 2 ? { situation: situation, choices: choices } : null;
  }

  var steps = { step1: getStep(1), step2: getStep(2), step3: getStep(3) };

  if (!steps.step1) { fireComplete(); return; }

  var stepLabels = { step1: 'Situation 1', step2: 'Situation 2', step3: 'Situation 3' };
  var stepNum    = 0;

  function showStep(key) {
    var step = steps[key];
    if (!step) { showOutcome('fail'); return; }
    stepNum++;

    stepEl.removeAttribute('hidden');
    outcomeEl.setAttribute('hidden', '');

    breadcrumbEl.textContent = stepLabels[key] || key;
    situationEl.textContent  = step.situation;

    choicesEl.innerHTML = '';
    step.choices.forEach(function (choice) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bs-choice kbf-option';
      // `role="listitem"` used to sit here, and it overrode the native button role: a screen reader
      // announced a list item and nothing said the thing was operable — the component's only
      // interaction. The container is a `group` now, so the buttons are left as buttons.

      var letter = document.createElement('span');
      letter.className = 'bs-choice-letter kbf-option-key';
      letter.setAttribute('aria-hidden', 'true');
      letter.textContent = choice.key.toUpperCase();

      var label = document.createElement('span');
      label.textContent = choice.text;

      btn.appendChild(letter);
      btn.appendChild(label);
      btn.addEventListener('click', function () { handleChoice(choice.next); });
      choicesEl.appendChild(btn);
    });

    /* Focus first choice */
    var first = choicesEl.querySelector('.bs-choice');
    if (first) setTimeout(function () { first.focus(); }, 50);
  }

  function handleChoice(next) {
    if (next === 'pass') showOutcome('pass');
    else if (next === 'fail') showOutcome('fail');
    else if (steps[next]) showStep(next);
    else showOutcome('fail');
  }

  function showOutcome(type) {
    stepEl.setAttribute('hidden', '');
    outcomeEl.removeAttribute('hidden');

    var isPass = type === 'pass';
    outcomeCard.className = 'bs-outcome-card';

    outcomeIcon.innerHTML = isPass ? SVG_PASS : SVG_FAIL;

    outcomeTitleEl.className = 'bs-outcome-title bs-outcome-title--' + type;
    outcomeTitleEl.textContent = isPass
      ? (c.pass_title || 'Great Choice!')
      : (c.fail_title || 'Not the best choice.');

    outcomeMsgEl.textContent = isPass
      ? (c.pass_message || '')
      : (c.fail_message || '');

    if (!isPass) {
      retryBtn.textContent = c.retry_label ? String(c.retry_label).trim() : 'Try Again';
      retryBtn.style.display = '';
    } else {
      retryBtn.style.display = 'none';
    }

    outcomeTitleEl.focus();

    if (isPass || !blocking) fireComplete();
  }

  retryBtn.addEventListener('click', function () {
    stepNum = 0;
    showStep('step1');
  });

  showStep('step1');
});
