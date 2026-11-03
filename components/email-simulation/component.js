KBF.define(function (root, kbf) {
  'use strict';
  var c = kbf.config;

  var fired = false;
  function fireComplete() {
    if (fired) return;
    fired = true;
    kbf.complete();
  }

  var blocking = c.blocking === 'true' || c.blocking === true;

  var fromEl         = root.querySelector('#es-from');
  var subjectEl      = root.querySelector('#es-subject');
  var avatarEl       = root.querySelector('#es-avatar');
  var dateEl         = root.querySelector('#es-date');
  var bodyEl         = root.querySelector('#es-body');
  var attachmentEl   = root.querySelector('#es-attachment');
  var attachLinkEl   = root.querySelector('#es-attachment-link');
  var attachNameEl   = root.querySelector('#es-attachment-name');
  var actionsEl      = root.querySelector('#es-actions');

  /* Populate header */
  var from = c.from ? String(c.from).trim() : 'Unknown Sender';
  fromEl.textContent = from;
  avatarEl.textContent = from[0] || '?';

  subjectEl.textContent = c.subject ? String(c.subject).trim() : '(no subject)';

  dateEl.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: 'numeric', minute: 'numeric'
  }).format(new Date());

  /* Body — allow plain text; strip script tags for safety */
  var raw = c.body ? String(c.body) : '';
  raw = raw.replace(/<script[\s\S]*?<\/script>/gi, '');
  bodyEl.innerHTML = raw;

  /* Suppress any links inside the body from navigating */
  bodyEl.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* Attachment */
  if (c.attachment_name) {
    attachNameEl.textContent = String(c.attachment_name).trim();
    if (c.attachment_link) attachLinkEl.href = '#';
    attachmentEl.removeAttribute('hidden');
    /* On the link, not on the `#es-attachment` div: `aria-label` on a div with no role is prohibited
       (axe `aria-prohibited-attr`) and silently does nothing, so the name was being set on the one
       element that could not use it. The link is where it belongs and it fixes a second fault at the
       same time — the link's static `aria-label="Attachment"` used to *replace* the filename inside
       it, so every attachment in every module announced as "Attachment, link" with no clue which
       file. Now: "Attachment: invoice-2287.pdf, link". */
    attachLinkEl.setAttribute('aria-label', 'Attachment: ' + c.attachment_name);
  }

  /* Got it button / auto-complete */
  if (blocking) {
    var btn = document.createElement('button');
    btn.className = 'es-got-it kbf-btn';
    btn.type = 'button';
    btn.textContent = 'Got It';
    btn.addEventListener('click', function () {
      btn.disabled = true;   // the recipe draws a disabled button (opacity .45); no inline style needed
      fireComplete();
    });
    actionsEl.appendChild(btn);
  } else {
    fireComplete();
  }
});
