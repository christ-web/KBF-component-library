KBF.define(function (root, kbf) {
  'use strict';
  var c = kbf.config;

  function fireComplete() {
    kbf.complete();
  }

  /* ---- Contact header ---- */
  var contactEl = root.querySelector('#cs-contact');
  var avatarEl  = root.querySelector('#cs-avatar');

  contactEl.textContent = c.contact_name ? String(c.contact_name).trim() : 'Contact';

  if (c.avatar_url) {
    avatarEl.style.backgroundImage = 'url(' + String(c.avatar_url).trim() + ')';
    avatarEl.classList.add('cs-avatar--has-image');
  }

  /* ---- Messages ---- */
  var msgsEl = root.querySelector('#cs-messages');

  if (c.date) {
    var dateDiv = document.createElement('div');
    dateDiv.className = 'cs-date';
    dateDiv.textContent = String(c.date).trim();
    msgsEl.appendChild(dateDiv);
  }

  for (var i = 1; i <= 6; i++) {
    var text = c['msg' + i] ? String(c['msg' + i]).trim() : '';
    if (!text) continue;

    var sentByMe = c['msg' + i + '_sent'] === 'true' || c['msg' + i + '_sent'] === true;
    var time     = c['msg' + i + '_time'] ? String(c['msg' + i + '_time']).trim() : '';

    var msgDiv = document.createElement('div');
    msgDiv.className = 'cs-msg' + (sentByMe ? ' cs-msg--sent' : '');

    // Who sent a message is carried visually by bubble alignment and colour alone, so this label is
    // the only sender cue a screen reader has — and it was being silently discarded: `aria-label` on
    // a div with no role is prohibited by ARIA, so AT ignored it. In a chat simulation that left a
    // screen-reader learner with an undifferentiated stream of messages and no attribution, which is
    // the entire learning point. `role="group"` makes the label valid and announced.
    //
    // The label carries the attribution only, not `text`. It used to prepend the message body, which
    // a group label does not suppress — so the fix that made the label audible would also have made
    // every message read out twice.
    msgDiv.setAttribute('role', 'group');
    var ariaLabel = sentByMe ? 'Sent' : 'Received';
    if (time) ariaLabel += ' at ' + time;
    msgDiv.setAttribute('aria-label', ariaLabel);

    var bubble = document.createElement('div');
    bubble.className = 'cs-bubble';
    bubble.textContent = text;

    msgDiv.appendChild(bubble);

    if (time) {
      var timeEl = document.createElement('div');
      timeEl.className = 'cs-msg-time';
      timeEl.setAttribute('aria-hidden', 'true');
      timeEl.textContent = time;
      msgDiv.appendChild(timeEl);
    }

    msgsEl.appendChild(msgDiv);
  }

  /* Scroll to bottom after render */
  var bodyEl = root.querySelector('#cs-body');
  bodyEl.scrollTop = bodyEl.scrollHeight;

  fireComplete();
});
