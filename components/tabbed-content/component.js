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

  var SVG_CHECK = '<svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><circle cx="6.5" cy="6.5" r="6.5" fill="var(--kbf-color-correct,#15803d)"/><path d="M3.5 6.5l2 2 4-4" stroke="var(--kbf-color-on-correct, #ffffff)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var tabsEl   = root.querySelector('#tc-tabs');
  var panelsEl = root.querySelector('#tc-panels');

  var tabs = [];
  for (var i = 1; i <= 4; i++) {
    var title   = c['tab' + i + '_title']   ? String(c['tab' + i + '_title']).trim()   : '';
    var content = c['tab' + i + '_content'] ? String(c['tab' + i + '_content']).trim() : '';
    if (!title) continue;
    tabs.push({ title: title, content: content, seen: false, btnEl: null, panelEl: null });
  }

  if (tabs.length === 0) { fireComplete(); return; }

  tabs.forEach(function (tab, idx) {
    var tabId   = 'tc-tab-' + idx;
    var panelId = 'tc-panel-' + idx;

    /* Tab button */
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tc-tab kbf-tab';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('id', tabId);
    btn.setAttribute('aria-controls', panelId);
    btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
    btn.setAttribute('tabindex', idx === 0 ? '0' : '-1');

    var label = document.createElement('span');
    label.textContent = tab.title;

    // The badge carried `aria-label="– Completed"` on a bare `<span>`. A span has no role, and
    // `aria-label` is ignored on a role-less (generic) element, so the accessible name was never
    // exposed: "already viewed" was a green tick and nothing else. Real text in a visually-hidden
    // child is exposed, and because the badge stays `display:none` until the tab is seen, it says
    // nothing about a tab the learner hasn't opened yet.
    var checkBadge = document.createElement('span');
    checkBadge.className = 'tc-tab-check';
    checkBadge.style.display = 'none';

    var checkLabel = document.createElement('span');
    checkLabel.className = 'tc-sr-only';
    checkLabel.textContent = ', viewed';

    btn.appendChild(label);
    btn.appendChild(checkBadge);
    tabsEl.appendChild(btn);
    tab.btnEl = btn;
    tab.checkEl = checkBadge;
    tab.checkLabelEl = checkLabel;

    /* Panel */
    var panel = document.createElement('div');
    panel.className = 'tc-panel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('id', panelId);
    panel.setAttribute('aria-labelledby', tabId);
    panel.setAttribute('tabindex', '0');
    if (idx !== 0) panel.setAttribute('hidden', '');
    panel.textContent = tab.content;
    panelsEl.appendChild(panel);
    tab.panelEl = panel;
  });

  var mounting = true;

  function activateTab(idx) {
    tabs.forEach(function (t, i) {
      var active = i === idx;
      t.btnEl.setAttribute('aria-selected', String(active));
      t.btnEl.setAttribute('tabindex', active ? '0' : '-1');
      if (active) t.panelEl.removeAttribute('hidden');
      else t.panelEl.setAttribute('hidden', '');
    });

    if (!tabs[idx].seen) {
      tabs[idx].seen = true;
      tabs[idx].checkEl.innerHTML = SVG_CHECK;
      // After `innerHTML`, which replaces the badge's children — appending first would drop it.
      tabs[idx].checkEl.appendChild(tabs[idx].checkLabelEl);
      tabs[idx].checkEl.style.display = '';

      // Progress towards the gate was a tick appearing on a tab the learner has already left
      // behind: `aria-selected` says which tab is current, nothing said how many were still
      // unopened, and on a `lock_next` page that is the difference between "Next is broken" and
      // "one section to go". WCAG 4.1.3 (Status Messages) — announced, not focused, because focus
      // stays on the tab the learner just chose.
      var seen = tabs.filter(function (t) { return t.seen; }).length;
      var all = seen === tabs.length;
      // Silent for the first tab, which this component opens for itself on mount. Announcing
      // there would talk over the page the learner has only just arrived on, and it reports no
      // state *change* — nothing has happened yet.
      if (!mounting) {
        kbf.a11y.announce(
          seen + ' of ' + tabs.length + ' tabs viewed.' + (all ? ' All tabs viewed.' : '')
        );
      }

      if (blocking && all) fireComplete();
      else if (!blocking) fireComplete();
    }
  }

  tabs.forEach(function (tab, idx) {
    tab.btnEl.addEventListener('click', function () { activateTab(idx); });
  });

  /* Arrow key roving tabindex (ARIA tabs pattern) */
  tabsEl.addEventListener('keydown', function (e) {
    var current = tabs.findIndex(function (t) { return t.btnEl.getAttribute('aria-selected') === 'true'; });
    var next = current;
    if (e.key === 'ArrowRight') { next = (current + 1) % tabs.length; }
    else if (e.key === 'ArrowLeft') { next = (current - 1 + tabs.length) % tabs.length; }
    else if (e.key === 'Home') { next = 0; }
    else if (e.key === 'End')  { next = tabs.length - 1; }
    else return;
    e.preventDefault();
    activateTab(next);
    tabs[next].btnEl.focus();
  });

  activateTab(0);
  mounting = false;
});
