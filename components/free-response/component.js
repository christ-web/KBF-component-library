KBF.define(function (root, kbf) {
  'use strict';

  var c = kbf.config;

  var fired = false;
  function fireComplete() {
    if (fired) return;
    fired = true;
    kbf.complete();
  }

  var title           = c.title              ? String(c.title).trim()              : 'Free Response';
  var instructions    = c.instructions       ? String(c.instructions).trim()       : '';
  var submitLabel     = c.submit_label       ? String(c.submit_label).trim()       : 'Submit';
  var feedbackTitle   = c.feedback_title     ? String(c.feedback_title).trim()     : 'Review Your Answers';
  var feedbackDesc    = c.feedback_description ? String(c.feedback_description).trim() : '';

  var questions = [];
  for (var i = 1; i <= 3; i++) {
    var qText = c['q' + i] ? String(c['q' + i]).trim() : '';
    if (!qText) continue;
    questions.push({
      text: qText,
      suggested: c['q' + i + '_suggested'] ? String(c['q' + i + '_suggested']).trim() : '',
      textareaEl: null,
      answer: ''
    });
  }

  var titleEl       = root.querySelector('#fr-title');
  var instructionsEl = root.querySelector('#fr-instructions');
  var questionsEl   = root.querySelector('#fr-questions');
  var submitBtn     = root.querySelector('#fr-submit-btn');
  var feedbackPanel = root.querySelector('#fr-feedback-panel');
  var stageEl       = root.querySelector('#fr-stage');

  if (titleEl) titleEl.textContent = title;
  if (instructionsEl) {
    if (instructions) {
      instructionsEl.textContent = instructions;
    } else {
      instructionsEl.style.display = 'none';
    }
  }
  if (submitBtn) submitBtn.textContent = submitLabel;

  questions.forEach(function (q, idx) {
    var group = document.createElement('div');
    group.className = 'fr-question-group';

    var item = document.createElement('div');
    item.className = 'fr-question-item';

    var qText = document.createElement('div');
    qText.className = 'fr-question-text';
    qText.textContent = q.text;

    var taId = 'fr-textarea-' + idx;

    var answerLabel = document.createElement('label');
    answerLabel.className = 'fr-answer-label';
    answerLabel.textContent = 'Your answer:';
    answerLabel.setAttribute('for', taId);

    var textarea = document.createElement('textarea');
    textarea.className = 'fr-textarea kbf-field';
    textarea.id = taId;
    textarea.rows = 4;
    textarea.setAttribute('aria-label', q.text);

    q.textareaEl = textarea;

    item.appendChild(qText);
    item.appendChild(answerLabel);
    item.appendChild(textarea);
    group.appendChild(item);
    questionsEl.appendChild(group);
  });

  if (submitBtn) {
    submitBtn.addEventListener('click', onSubmit);
  }

  function onSubmit() {
    questions.forEach(function (q) {
      q.answer = q.textareaEl ? q.textareaEl.value : '';
    });

    questions.forEach(function (q) {
      if (q.textareaEl) q.textareaEl.disabled = true;
    });
    if (submitBtn) submitBtn.disabled = true;

    buildFeedback();

    if (stageEl) stageEl.style.display = 'none';
    if (feedbackPanel) {
      feedbackPanel.style.display = 'block';
      // The panel replaces the whole activity, including the button that was focused. Moving focus
      // into the replacement is what tells a screen reader the view changed — and is why there is no
      // live-region announcement here as well: the two would talk over each other.
      feedbackPanel.setAttribute('aria-label', feedbackTitle || 'Review your answers');
      feedbackPanel.focus();
    }

    fireComplete();
  }

  function buildFeedback() {
    if (!feedbackPanel) return;
    feedbackPanel.innerHTML = '';

    questions.forEach(function (q) {
      var group = document.createElement('div');
      group.className = 'fr-feedback-group';

      var qTextEl = document.createElement('div');
      qTextEl.className = 'fr-feedback-question-text';
      qTextEl.textContent = q.text;

      var cards = document.createElement('div');
      cards.className = 'fr-feedback-cards';

      var yourCard = document.createElement('div');
      yourCard.className = 'fr-feedback-card';
      var yourLabel = document.createElement('div');
      yourLabel.className = 'fr-feedback-card-label';
      yourLabel.textContent = 'Your answer';
      var yourText = document.createElement('p');
      yourText.textContent = q.answer || '(no answer provided)';
      yourCard.appendChild(yourLabel);
      yourCard.appendChild(yourText);

      var sugCard = document.createElement('div');
      sugCard.className = 'fr-feedback-card fr-feedback-card--suggested';
      var sugLabel = document.createElement('div');
      sugLabel.className = 'fr-feedback-card-label';
      sugLabel.textContent = 'Suggested answer';
      var sugText = document.createElement('p');
      sugText.textContent = q.suggested || '(no suggested answer provided)';
      sugCard.appendChild(sugLabel);
      sugCard.appendChild(sugText);

      cards.appendChild(yourCard);
      cards.appendChild(sugCard);
      group.appendChild(qTextEl);
      group.appendChild(cards);
      feedbackPanel.appendChild(group);
    });

    if (feedbackTitle || feedbackDesc) {
      var summary = document.createElement('div');
      summary.className = 'fr-feedback-summary';
      if (feedbackTitle) {
        var h = document.createElement('h2');
        h.className = 'fr-feedback-summary-title';
        h.textContent = feedbackTitle;
        summary.appendChild(h);
      }
      if (feedbackDesc) {
        var p = document.createElement('p');
        p.className = 'fr-feedback-summary-desc';
        p.textContent = feedbackDesc;
        summary.appendChild(p);
      }
      feedbackPanel.appendChild(summary);
    }
  }

});
