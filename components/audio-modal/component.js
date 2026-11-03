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

  var SVG_CHECK = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="11" fill="var(--kbf-color-correct, #15803d)"/><path d="M6 11l3.5 3.5L16 7" stroke="var(--kbf-color-on-correct, #ffffff)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var SVG_PLAY  = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M8 5L18 11L8 17V5Z" fill="currentColor"/></svg>';
  var SVG_PAUSE = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><rect x="5" y="4" width="4" height="14" rx="1" fill="currentColor"/><rect x="13" y="4" width="4" height="14" rx="1" fill="currentColor"/></svg>';
  var SVG_SPIN  = '<svg class="am-spin" width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="12" stroke="rgba(255,255,255,0.3)" stroke-width="3"/><path d="M16 4a12 12 0 0 1 12 12" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>';

  var tilesEl = root.querySelector('#am-tiles');
  var overlay = root.querySelector('#am-overlay');
  var box     = root.querySelector('#am-box');
  var closeBtn = root.querySelector('#am-close');
  var playerEl = root.querySelector('#am-player');

  var tiles = [];
  for (var i = 1; i <= 3; i++) {
    var src   = c['tile' + i + '_src']   ? String(c['tile' + i + '_src']).trim()   : '';
    var cover = c['tile' + i + '_cover'] ? String(c['tile' + i + '_cover']).trim() : '';
    var title = c['tile' + i + '_title'] ? String(c['tile' + i + '_title']).trim() : '';
    var vtt   = c['tile' + i + '_vtt']   ? String(c['tile' + i + '_vtt']).trim()   : '';
    if (!src) continue;
    // `cues` is filled on first open and kept: reopening a tile rebuilds the player from scratch, and
    // re-fetching a transcript the learner has already read would show an empty panel each time on a
    // slow connection.
    tiles.push({ src: src, cover: cover, title: title, vtt: vtt, cues: null, opened: false, el: null });
  }

  tiles.forEach(function (tile, idx) {
    var div = document.createElement('div');
    div.className = 'am-tile kbf-tile';
    // `role="listitem"` used to sit here, and it is the whole of what a screen reader announced: a list
    // item, with nothing saying the tile could be opened — while the click and keydown handlers below
    // made it the component's only interaction (WCAG 4.1.2). The container is a named `group` now, so
    // this can be what it behaves like. The `tabindex`, the name and both handlers are what complete
    // the pattern; a `role="button"` without them would be a lie in the other direction.
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    var tileName = 'Play audio: ' + (tile.title || 'track ' + (idx + 1));
    div.setAttribute('aria-label', tileName);

    var coverWrap = document.createElement('div');
    coverWrap.className = 'am-cover-wrap';
    if (tile.cover) coverWrap.style.backgroundImage = 'url(' + tile.cover + ')';

    var playIcon = document.createElement('div');
    playIcon.className = 'am-play-icon';
    playIcon.innerHTML = SVG_PLAY;
    playIcon.setAttribute('aria-hidden', 'true');

    var done = document.createElement('span');
    done.className = 'am-done-badge';
    done.innerHTML = SVG_CHECK;
    done.setAttribute('aria-hidden', 'true');

    coverWrap.appendChild(playIcon);
    coverWrap.appendChild(done);

    var titleEl = document.createElement('p');
    titleEl.className = 'am-tile-title';
    titleEl.textContent = tile.title || '';

    div.appendChild(coverWrap);
    div.appendChild(titleEl);
    tilesEl.appendChild(div);

    tile.el = div;

    function openModal() {
      buildPlayer(tile);
      overlay.setAttribute('aria-label', tile.title || 'Audio player');
      overlay.removeAttribute('hidden');
      trapFocus(box);
      closeBtn.focus();
      // Same reasoning as interactive-modals: until now the opened state was the class alone. The tick
      // drawn over the cover is `aria-hidden` and the title's green is colour on its own, so the tile's
      // accessible name stayed "Play audio: X" for ever and a screen-reader learner had no way to tell
      // an opened tile from an unopened one — and on a `lock_next` page the opened count is what decides
      // whether Next works. So the state goes into the name (the visible title is still contained in it,
      // WCAG 2.5.3) and the aggregate is announced.
      if (!tile.opened) {
        tile.opened = true;
        div.classList.add('am-tile--done');
        div.setAttribute('aria-label', tileName + ', opened');

        var opened = tiles.filter(function (t) { return t.opened; }).length;
        kbf.a11y.announce(
          opened + ' of ' + tiles.length + ' opened.'
          + (opened === tiles.length ? ' All opened.' : '')
        );

        if (!blocking) fireComplete();
        else if (tiles.every(function (t) { return t.opened; })) fireComplete();
      }
    }

    div.addEventListener('click', openModal);
    div.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(); }
    });
  });

  var currentAudio = null;

  function buildPlayer(tile) {
    // Stop any existing audio
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }

    playerEl.innerHTML = '';

    var stage = document.createElement('div');
    stage.className = 'am-modal-stage';

    var cover = document.createElement('div');
    cover.className = 'am-modal-cover';
    if (tile.cover) cover.style.backgroundImage = 'url(' + tile.cover + ')';

    var loadingEl = document.createElement('div');
    loadingEl.className = 'am-modal-loading';
    loadingEl.innerHTML = SVG_SPIN;
    loadingEl.setAttribute('role', 'status');
    loadingEl.setAttribute('aria-label', 'Loading');

    var ppBtn = document.createElement('button');
    ppBtn.type = 'button';
    ppBtn.className = 'am-modal-play';
    ppBtn.setAttribute('aria-label', 'Play');
    ppBtn.innerHTML = SVG_PLAY;
    ppBtn.style.display = 'none';

    cover.appendChild(loadingEl);
    cover.appendChild(ppBtn);

    var controls = document.createElement('div');
    controls.className = 'am-modal-controls';

    var timeEl = document.createElement('time');
    timeEl.className = 'am-modal-time';
    timeEl.textContent = '0:00';

    var progressEl = document.createElement('div');
    progressEl.className = 'am-modal-progress';
    progressEl.setAttribute('role', 'slider');
    progressEl.setAttribute('aria-label', 'Seek');
    progressEl.setAttribute('aria-valuemin', '0');
    progressEl.setAttribute('aria-valuemax', '100');
    progressEl.setAttribute('aria-valuenow', '0');
    progressEl.setAttribute('tabindex', '0');

    var barEl = document.createElement('div');
    barEl.className = 'am-modal-bar';

    progressEl.appendChild(barEl);
    controls.appendChild(timeEl);
    controls.appendChild(progressEl);

    stage.appendChild(cover);
    stage.appendChild(controls);
    playerEl.appendChild(stage);

    /* ---- Transcript ----
       The same panel audio-player builds, for the same reason it exists there: the audio is played
       through `new Audio()` (below), which is a media element with no document node, so it can carry no
       `<track>` and no `<track>` can be styled or read. A VTT reaching a learner here has to be fetched
       and rendered by hand. Third copy of `parseVtt`/`vttTime` in the library, after video-player and
       audio-player — a runtime helper would be the tidier home for it, but that is an addition to the
       API every component sees, not part of adding a transcript to this one. */
    var cueList = null;
    if (tile.vtt) {
      var panel = document.createElement('div');
      panel.className = 'am-transcript-panel';

      var heading = document.createElement('h4');
      heading.className = 'am-transcript-heading';
      // Unique per instance because each one renders in its own shadow root, so an id collision
      // between two placed copies of this component is not possible.
      heading.id = 'am-transcript-heading';
      heading.textContent = 'Transcript';

      cueList = document.createElement('ul');
      cueList.className = 'am-cues';
      // Named by its heading rather than given `role="region"`, which would replace the list semantics
      // a screen reader needs to announce how many cues there are. Focusable because it scrolls, and
      // cues below the fold are otherwise reachable only with a pointer (WCAG 2.1.1).
      cueList.setAttribute('aria-live', 'polite');
      cueList.setAttribute('tabindex', '0');
      cueList.setAttribute('aria-labelledby', heading.id);

      panel.appendChild(heading);
      panel.appendChild(cueList);
      playerEl.appendChild(panel);
    }

    var audio = new Audio(tile.src);
    currentAudio = audio;
    var totalTime = 0;

    audio.load();

    if (tile.vtt) {
      if (tile.cues) buildCues();
      else {
        fetch(tile.vtt).then(function (r) { return r.text(); }).then(function (txt) {
          tile.cues = parseVtt(txt);
          // The modal may have been closed and another tile opened while this was in flight. What
          // stops that reaching the learner is `playerEl.innerHTML = ''` above: `cueList` here is
          // captured per player, so a late response fills a list already detached from the panel.
          // This guard is the second layer — it skips building a cue list nobody can see, and it is
          // what keeps that true if the rebuild ever becomes a reuse rather than a replacement.
          if (currentAudio === audio) buildCues();
        }).catch(function () {});
      }
    }

    function buildCues() {
      if (!cueList || !tile.cues) return;
      cueList.innerHTML = '';
      tile.cues.forEach(function (cue, idx) {
        var li = document.createElement('li');
        li.className = 'am-cue';
        li.dataset.idx = String(idx);
        var t = document.createElement('span');
        t.className = 'am-cue-time';
        t.textContent = fmt(cue.start);
        t.setAttribute('aria-hidden', 'true');
        var s = document.createElement('span');
        s.textContent = cue.text;
        li.appendChild(t);
        li.appendChild(s);
        li.addEventListener('click', function () { audio.currentTime = cue.start; });
        cueList.appendChild(li);
      });
    }

    function highlightCue() {
      if (!cueList || !tile.cues) return;
      var t = audio.currentTime;
      var items = cueList.querySelectorAll('.am-cue');
      items.forEach(function (li) {
        var cue = tile.cues[parseInt(li.dataset.idx, 10)];
        var active = cue && t >= cue.start && t < cue.end;
        var wasActive = li.classList.contains('am-cue--active');
        li.classList.toggle('am-cue--active', active);
        if (active && !wasActive) li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }

    audio.addEventListener('canplaythrough', function () {
      totalTime = audio.duration;
      loadingEl.style.display = 'none';
      ppBtn.style.display = '';
      ppBtn.focus();
    });

    audio.addEventListener('playing', function () {
      ppBtn.innerHTML = SVG_PAUSE;
      ppBtn.setAttribute('aria-label', 'Pause');
    });

    audio.addEventListener('pause', function () {
      ppBtn.innerHTML = SVG_PLAY;
      ppBtn.setAttribute('aria-label', 'Play');
    });

    audio.addEventListener('timeupdate', function () {
      if (!totalTime) return;
      var pct = (audio.currentTime / totalTime) * 100;
      barEl.style.width = pct + '%';
      progressEl.setAttribute('aria-valuenow', Math.round(pct).toString());
      timeEl.textContent = fmt(audio.currentTime);
      highlightCue();
    });

    ppBtn.addEventListener('click', function () {
      if (audio.paused) audio.play();
      else audio.pause();
    });

    progressEl.addEventListener('click', function (e) {
      if (!totalTime) return;
      var rect = progressEl.getBoundingClientRect();
      audio.currentTime = totalTime * ((e.clientX - rect.left) / rect.width);
    });

    // audio-player has had this from the start and this component never did, which left a focusable
    // `role="slider"` that only a mouse could move — WCAG 2.1.1, and the kind of gap axe cannot see
    // because the element has every ARIA attribute it should.
    progressEl.addEventListener('keydown', function (e) {
      if (!totalTime) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); audio.currentTime = Math.min(totalTime, audio.currentTime + 5); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); audio.currentTime = Math.max(0, audio.currentTime - 5); }
    });

    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'kbf:mute') audio.muted = true;
    });
  }

  /* Close */
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });

  var trapHandler = null;

  function closeModal() {
    if (currentAudio) { currentAudio.pause(); }
    overlay.setAttribute('hidden', '');
    if (trapHandler) { box.removeEventListener('keydown', trapHandler); trapHandler = null; }
    var last = tiles.filter(function (t) { return t.opened; }).pop();
    if (last && last.el) last.el.focus();
  }

  function trapFocus(el) {
    if (trapHandler) el.removeEventListener('keydown', trapHandler);
    trapHandler = function (e) {
      if (e.key !== 'Tab') return;
      // Queried on each Tab rather than once when the trap is installed: the modal body is injected
      // afterwards, so a list captured up front would miss everything inside it. An empty list
      // returns early — `first`/`last` would be undefined and `.focus()` would throw.
      var focusable = el.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
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

  /* Copied from audio-player rather than shared: a component is one self-contained trio of files with
     nothing to import from. Kept byte-identical so a fix to the parser can be applied by diff. */
  function parseVtt(text) {
    var cues = [];
    var lines = text.replace(/\r\n/g, '\n').split('\n');
    var i = 0;
    while (i < lines.length) {
      var line = lines[i].trim();
      if (line.indexOf('-->') > -1) {
        var parts = line.split('-->');
        var start = vttTime(parts[0].trim());
        var end = vttTime(parts[1].trim().split(' ')[0]);
        var textParts = [];
        i++;
        while (i < lines.length && lines[i].trim() !== '') {
          textParts.push(lines[i].trim().replace(/<[^>]+>/g, ''));
          i++;
        }
        if (textParts.length) cues.push({ start: start, end: end, text: textParts.join(' ') });
      }
      i++;
    }
    return cues;
  }

  function vttTime(s) {
    var p = s.split(':');
    var sec = 0;
    for (var j = 0; j < p.length; j++) sec = sec * 60 + parseFloat(p[j]);
    return sec;
  }

  function fmt(s) {
    if (!s || isNaN(s)) return '0:00';
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  if (!blocking) fireComplete();
});
