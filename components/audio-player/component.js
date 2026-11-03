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
  var vttUrl   = c.vtt ? String(c.vtt).trim() : '';

  var loadingEl   = root.querySelector('#ap-loading');
  var playPauseBtn = root.querySelector('#ap-play-pause');
  var doneBadge   = root.querySelector('#ap-done-badge');
  var cover       = root.querySelector('#ap-cover');
  var timeEl      = root.querySelector('#ap-time');
  var progressEl  = root.querySelector('#ap-progress');
  var barEl       = root.querySelector('#ap-progress-bar');
  var transcriptPanel = root.querySelector('#ap-transcript-panel');
  var cueList     = root.querySelector('#ap-cues');

  var I_PLAY  = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 5L19 12L8 19V5Z" fill="currentColor"/></svg>';
  var I_PAUSE = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="15" y="4" width="4" height="16" rx="1" fill="currentColor"/></svg>';

  if (c.cover_image) {
    cover.style.backgroundImage = 'url(' + String(c.cover_image) + ')';
  }

  var audio = new Audio();
  var totalTime = 0;
  var completed = false;
  var parsed = [];

  if (c.src) {
    audio.src = String(c.src).trim();
    audio.load();
  }

  audio.addEventListener('canplaythrough', function () {
    totalTime = audio.duration;
    loadingEl.style.display = 'none';
    playPauseBtn.innerHTML = I_PLAY;
    playPauseBtn.style.display = '';
  });

  audio.addEventListener('playing', function () {
    playPauseBtn.innerHTML = I_PAUSE;
    playPauseBtn.setAttribute('aria-label', 'Pause');
  });

  audio.addEventListener('pause', function () {
    playPauseBtn.innerHTML = I_PLAY;
    playPauseBtn.setAttribute('aria-label', 'Play');
  });

  audio.addEventListener('ended', function () {
    playPauseBtn.innerHTML = I_PLAY;
    playPauseBtn.setAttribute('aria-label', 'Play');
    if (!blocking) fireComplete();
  });

  audio.addEventListener('timeupdate', function () {
    if (!totalTime) return;
    var pct = (audio.currentTime / totalTime) * 100;
    barEl.style.width = pct + '%';
    progressEl.setAttribute('aria-valuenow', Math.round(pct).toString());
    timeEl.textContent = fmt(audio.currentTime);
    if (parsed.length) highlightCue();
    if (blocking && !fired && pct >= 95) {
      completed = true;
      doneBadge.style.display = '';
      fireComplete();
    }
  });

  playPauseBtn.addEventListener('click', function () {
    if (audio.paused) audio.play();
    else audio.pause();
  });

  progressEl.addEventListener('click', function (e) {
    if (!totalTime) return;
    var rect = progressEl.getBoundingClientRect();
    audio.currentTime = totalTime * ((e.clientX - rect.left) / rect.width);
  });

  progressEl.addEventListener('keydown', function (e) {
    if (!totalTime) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); audio.currentTime = Math.min(totalTime, audio.currentTime + 5); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); audio.currentTime = Math.max(0, audio.currentTime - 5); }
  });

  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'kbf:mute') audio.muted = true;
  });

  /* ---- Transcript ---- */
  if (vttUrl) {
    transcriptPanel.style.display = '';
    fetch(vttUrl).then(function (r) { return r.text(); }).then(function (txt) {
      parsed = parseVtt(txt);
      buildCues();
    }).catch(function () {});
  }

  function buildCues() {
    cueList.innerHTML = '';
    parsed.forEach(function (cue, idx) {
      var li = document.createElement('li');
      li.className = 'ap-cue';
      li.dataset.idx = String(idx);
      var t = document.createElement('span');
      t.className = 'ap-cue-time';
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
    var t = audio.currentTime;
    var items = cueList.querySelectorAll('.ap-cue');
    items.forEach(function (li) {
      var cue = parsed[parseInt(li.dataset.idx, 10)];
      var active = cue && t >= cue.start && t < cue.end;
      var wasActive = li.classList.contains('ap-cue--active');
      li.classList.toggle('ap-cue--active', active);
      if (active && !wasActive) li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

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
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = Math.floor(s % 60);
    return (h > 0 ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  if (!blocking) fireComplete();
});
