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

  var SVG_RED  = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="11" fill="var(--kbf-color-incorrect,#dc2626)"/><path d="M7 7l8 8M15 7l-8 8" stroke="var(--kbf-color-on-incorrect, #ffffff)" stroke-width="2" stroke-linecap="round"/></svg>';
  var SVG_SAFE = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="11" fill="var(--kbf-color-correct,#15803d)"/><path d="M6 11l3.5 3.5L16 7" stroke="var(--kbf-color-on-correct, #ffffff)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---- Build email ---- */
  var from = c.from ? String(c.from).trim() : 'Unknown Sender';
  var to   = c.to   ? String(c.to).trim()   : '';

  root.querySelector('#ed-avatar').textContent = from[0] || '?';
  root.querySelector('#ed-subject-bar').textContent = c.subject ? String(c.subject).trim() : '(no subject)';

  var meta = root.querySelector('#ed-meta');
  function metaRow(label, val) {
    if (!val) return;
    var div = document.createElement('div');
    div.className = 'ed-meta-row';
    div.innerHTML = '<span class="ed-meta-label">' + label + ': </span><strong>' + escText(val) + '</strong>';
    meta.appendChild(div);
  }
  metaRow('From',    from);
  if (to)            metaRow('To', to);
  metaRow('Subject', c.subject ? String(c.subject).trim() : '');

  var dateStr = c.date ? String(c.date).trim() : new Intl.DateTimeFormat(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: 'numeric'
  }).format(new Date());
  metaRow('Date', dateStr);

  var bodyEl = root.querySelector('#ed-body');
  var rawBody = c.body ? String(c.body) : '';
  rawBody = rawBody.replace(/<script[\s\S]*?<\/script>/gi, '');
  bodyEl.innerHTML = rawBody;
  bodyEl.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); }); });

  /* ---- Build flags ---- */
  var flags = [];
  for (var i = 1; i <= 5; i++) {
    var label = c['flag' + i + '_label'] ? String(c['flag' + i + '_label']).trim() : '';
    if (!label) continue;
    var type  = (c['flag' + i + '_type'] || 'red').toLowerCase().trim();
    if (type !== 'safe') type = 'red';
    var expl  = c['flag' + i + '_explanation'] ? String(c['flag' + i + '_explanation']).trim() : '';
    flags.push({ label: label, type: type, expl: expl, opened: false, el: null });
  }

  var flagList = root.querySelector('#ed-flag-list');
  var heading  = root.querySelector('#ed-flags');

  if (flags.length === 0) {
    heading.style.display = 'none';
    fireComplete();
  }

  flags.forEach(function (flag, idx) {
    var li = document.createElement('li');
    li.setAttribute('role', 'listitem');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ed-flag-item kbf-option';
    btn.setAttribute('aria-label', 'Review flag: ' + flag.label);

    var num = document.createElement('span');
    num.className = 'ed-flag-num kbf-option-key';
    num.textContent = String(idx + 1);
    num.setAttribute('aria-hidden', 'true');

    var lbl = document.createElement('span');
    lbl.className = 'ed-flag-label';
    lbl.textContent = flag.label;

    var arrow = document.createElement('span');
    arrow.className = 'ed-flag-arrow';
    arrow.innerHTML = '&#8594;';
    arrow.setAttribute('aria-hidden', 'true');

    var badge = document.createElement('span');
    badge.className = 'ed-flag-badge';
    badge.setAttribute('aria-hidden', 'true');

    btn.appendChild(num);
    btn.appendChild(lbl);
    btn.appendChild(badge);
    btn.appendChild(arrow);
    li.appendChild(btn);
    flagList.appendChild(li);

    flag.el = btn;

    btn.addEventListener('click', function () {
      openPanel(flag, idx);
      if (!flag.opened) {
        flag.opened = true;
        btn.classList.add('ed-flag-item--opened');
        badge.innerHTML = flag.type === 'red' ? SVG_RED : SVG_SAFE;
        checkCompletion();
      }
    });
  });

  function checkCompletion() {
    if (!blocking) { fireComplete(); return; }
    if (flags.every(function (f) { return f.opened; })) fireComplete();
  }

  /* ---- Panel ---- */
  var panel      = root.querySelector('#ed-panel');
  var panelBox   = root.querySelector('#ed-panel-box');
  var panelClose = root.querySelector('#ed-panel-close');
  var panelContent = root.querySelector('#ed-panel-content');
  var trapHandler = null;

  function openPanel(flag, idx) {
    panelContent.innerHTML = '';

    var icon = document.createElement('div');
    icon.className = 'ed-panel-icon ed-panel-icon--' + flag.type;
    icon.innerHTML = flag.type === 'red' ? SVG_RED : SVG_SAFE;
    icon.setAttribute('aria-hidden', 'true');

    var typeTag = document.createElement('p');
    typeTag.className = 'ed-panel-type ed-panel-type--' + flag.type;
    typeTag.textContent = flag.type === 'red' ? 'Red Flag — Suspicious' : 'Safe — Not a concern';

    var title = document.createElement('h2');
    title.className = 'ed-panel-title';
    title.textContent = (idx + 1) + '. ' + flag.label;

    var text = document.createElement('p');
    text.className = 'ed-panel-text';
    text.textContent = flag.expl || 'No explanation provided.';

    panelContent.appendChild(icon);
    panelContent.appendChild(typeTag);
    panelContent.appendChild(title);
    panelContent.appendChild(text);

    panel.removeAttribute('hidden');
    trapFocus(panelBox);
    panelClose.focus();
  }

  function closePanel() {
    panel.setAttribute('hidden', '');
    if (trapHandler) { panelBox.removeEventListener('keydown', trapHandler); trapHandler = null; }
    var last = flags.filter(function (f) { return f.opened; }).pop();
    if (last && last.el) last.el.focus();
  }

  panelClose.addEventListener('click', closePanel);
  panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(); });
  panel.addEventListener('click', function (e) { if (e.target === panel) closePanel(); });

  function trapFocus(el) {
    if (trapHandler) el.removeEventListener('keydown', trapHandler);
    trapHandler = function (e) {
      if (e.key !== 'Tab') return;
      // Queried on each Tab rather than once when the trap is installed: the panel body is injected
      // afterwards, so a list captured up front would miss everything inside it. An empty list
      // returns early — `first`/`last` would be undefined and `.focus()` would throw.
      var focusable = el.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
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

  function escText(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  if (!blocking) fireComplete();
});
