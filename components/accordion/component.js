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

  var SVG_CHEVRON = '<svg class="acc-chevron-svg" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var SVG_CHECK   = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="9" fill="var(--kbf-color-correct, #15803d)"/><path d="M5 9L7.5 11.5L13 6.5" stroke="var(--kbf-color-on-correct, #ffffff)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var items = [];
  for (var i = 1; i <= 4; i++) {
    var title = c['item' + i + '_title'] ? String(c['item' + i + '_title']).trim() : '';
    var body  = c['item' + i + '_body']  ? String(c['item' + i + '_body']).trim()  : '';
    if (!title) continue;
    // `opened` is "has been read", which is what the tick and the completion count, and it never goes
    // back. Whether a section is showing is `expanded`: one at a time, and closable (Chris, 2026-10-28).
    items.push({ title: title, body: body, opened: false, expanded: false });
  }

  var list = root.querySelector('#acc-list');
  var itemEls = [];

  items.forEach(function (item, idx) {
    var btnId    = 'acc-btn-' + idx;
    var regionId = 'acc-region-' + idx;

    var div = document.createElement('div');
    div.className = 'acc-item';
    div.setAttribute('role', 'listitem');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'acc-header kbf-disclosure';
    btn.id = btnId;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', regionId);

    // `aria-label="Completed"` used to sit here. It did nothing — a bare `<span>` has no role and
    // `aria-label` is ignored on a role-less element — and it could not simply be swapped for real
    // text, because the tick is only *transparent* (`.acc-check { opacity: 0 }`) until the item is
    // opened, and `opacity:0` stays in the accessibility tree. Text inside it would have announced
    // "Completed" on every unopened item. The tick is decorative: `aria-expanded` on the header is
    // what carries this item's state, and the aggregate is announced below.
    var checkEl = document.createElement('span');
    checkEl.className = 'acc-check';
    checkEl.innerHTML = SVG_CHECK;
    checkEl.setAttribute('aria-hidden', 'true');

    var titleEl = document.createElement('span');
    titleEl.className = 'acc-title';
    titleEl.textContent = item.title;

    var chevronEl = document.createElement('span');
    chevronEl.className = 'acc-chevron';
    chevronEl.innerHTML = SVG_CHEVRON;

    btn.appendChild(checkEl);
    btn.appendChild(titleEl);
    btn.appendChild(chevronEl);

    var wrap = document.createElement('div');
    wrap.className = 'acc-content-wrap';
    wrap.id = regionId;
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-labelledby', btnId);
    // A closed section is collapsed to nothing on screen; this keeps a screen reader from reading it.
    wrap.setAttribute('aria-hidden', 'true');

    var content = document.createElement('div');
    content.className = 'acc-content';
    content.textContent = item.body;

    wrap.appendChild(content);
    div.appendChild(btn);
    div.appendChild(wrap);
    list.appendChild(div);

    itemEls.push({ div: div, btn: btn, wrap: wrap, data: item });

    btn.addEventListener('click', function () {
      toggleItem(idx);
    });

    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        var next = itemEls[(idx + 1) % itemEls.length];
        if (next) next.btn.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        var prev = itemEls[(idx - 1 + itemEls.length) % itemEls.length];
        if (prev) prev.btn.focus();
      }
    });
  });

  function setExpanded(el, on) {
    el.data.expanded = on;
    el.div.classList.toggle('acc-open', on);
    el.btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    el.wrap.setAttribute('aria-hidden', on ? 'false' : 'true');
  }

  /** Open a section, closing whichever one was open; or close it if it already is. */
  function toggleItem(idx) {
    var el = itemEls[idx];
    if (!el) return;
    if (el.data.expanded) { setExpanded(el, false); return; }
    itemEls.forEach(function (other) { if (other !== el && other.data.expanded) setExpanded(other, false); });
    setExpanded(el, true);
    if (el.data.opened) return;

    el.data.opened = true;
    el.div.classList.add('acc-opened');

    // How many sections are still shut was a row of ticks and nothing else. `aria-expanded` reports
    // the section the learner just opened, never the aggregate — and when `blocking` is on, the
    // aggregate is the only thing that decides whether Next works. WCAG 4.1.3 (Status Messages);
    // announced rather than focused, because focus belongs on the header they pressed.
    var opened = items.filter(function (it) { return it.opened; }).length;
    kbf.a11y.announce(
      opened + ' of ' + items.length + ' sections opened.'
      + (opened === items.length ? ' All sections opened.' : '')
    );

    checkCompletion();
  }

  function checkCompletion() {
    if (!blocking) {
      fireComplete();
      return;
    }
    if (items.every(function (it) { return it.opened; })) {
      fireComplete();
    }
  }

  if (!blocking) fireComplete();
});
