KBF.define(function (root, kbf) {
  'use strict';
  var c = kbf.config;

  var fired = false;
  function fireComplete() {
    if (fired) return;
    fired = true;
    kbf.complete();
  }

  var blocking      = !(c.blocking === 'false' || c.blocking === false);
  // Absent reads as on, matching the schema's default (2026-10-10), as `blocking` above does.
  var showTranscript = !(c.show_transcript === 'false' || c.show_transcript === false);
  var showCaptionsByDefault = c.show_captions === 'true' || c.show_captions === true;

  var titleEl       = root.querySelector('#vp-title');
  var video         = root.querySelector('#vp-video');
  var stage         = root.querySelector('#vp-stage');
  var controls      = root.querySelector('#vp-controls');
  var playPauseBtn  = root.querySelector('#vp-play-pause');
  var progressWrap  = root.querySelector('#vp-progress-wrap');
  var progressBar   = root.querySelector('#vp-progress-bar');
  var timeEl        = root.querySelector('#vp-time');
  var muteBtn       = root.querySelector('#vp-mute-btn');
  var ccBtn         = root.querySelector('#vp-cc-btn');
  var fsBtn         = root.querySelector('#vp-fs-btn');
  var endCard       = root.querySelector('#vp-end-card');
  var replayBtn     = root.querySelector('#vp-replay-btn');
  var transcriptBar = root.querySelector('#vp-transcript-bar');
  var transcriptToggle = root.querySelector('#vp-transcript-toggle');
  var transcriptPanel  = root.querySelector('#vp-transcript');
  var cueList       = root.querySelector('#vp-cue-list');

  /* ---- SVG icons ---- */
  var I_PLAY    = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M6 4L16 10L6 16V4Z" fill="currentColor"/></svg>';
  var I_PAUSE   = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="4" y="3" width="4" height="14" rx="1" fill="currentColor"/><rect x="12" y="3" width="4" height="14" rx="1" fill="currentColor"/></svg>';
  var I_VOL     = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M9 4L5 8H3v4h2l4 4V4Z" fill="currentColor"/><path d="M13.5 6.5a5 5 0 0 1 0 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  var I_MUTED   = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M9 4L5 8H3v4h2l4 4V4Z" fill="currentColor"/><path d="M15 8l-4 4m0-4l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  var I_FS      = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M2 6V2h4M12 2h4v4M16 12v4h-4M6 16H2v-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var I_EFS     = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M6 2v4H2M16 6h-4V2M2 12h4v4M12 16v-4h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---- Setup ---- */
  if (c.title) titleEl.textContent = String(c.title);
  else titleEl.style.display = 'none';

  if (c.poster) video.poster = String(c.poster);

  if (c.src) {
    var src = String(c.src).trim();
    var sourceEl = document.createElement('source');
    sourceEl.src = src;
    sourceEl.type = src.indexOf('.webm') > -1 ? 'video/webm' : 'video/mp4';
    video.appendChild(sourceEl);
  }

  var vttUrl = c.vtt ? String(c.vtt).trim() : '';
  var track;
  if (vttUrl) {
    track = document.createElement('track');
    track.kind = 'captions';
    track.src = vttUrl;
    track.label = 'Captions';
    track.srclang = 'en';
    video.appendChild(track);
    video.addEventListener('loadeddata', function () {
      if (video.textTracks[0]) {
        video.textTracks[0].mode = showCaptionsByDefault ? 'showing' : 'hidden';
        if (showCaptionsByDefault) {
          ccBtn.setAttribute('aria-pressed', 'true');
          ccBtn.classList.add('vp-btn--active');
        }
      }
    });
  } else {
    ccBtn.style.display = 'none';
  }

  playPauseBtn.innerHTML = I_PLAY;
  muteBtn.innerHTML = I_VOL;
  fsBtn.innerHTML = I_FS;

  /* ---- Play / Pause ---- */
  playPauseBtn.addEventListener('click', function () {
    if (video.paused) video.play();
    else video.pause();
  });

  video.addEventListener('play', function () {
    playPauseBtn.innerHTML = I_PAUSE;
    playPauseBtn.setAttribute('aria-label', 'Pause');
    endCard.hidden = true;
    resetHideTimer();
  });

  video.addEventListener('pause', function () {
    playPauseBtn.innerHTML = I_PLAY;
    playPauseBtn.setAttribute('aria-label', 'Play');
    clearTimeout(hideTimer);
    controls.classList.remove('vp-hidden');
  });

  video.addEventListener('ended', function () {
    playPauseBtn.innerHTML = I_PLAY;
    playPauseBtn.setAttribute('aria-label', 'Play');
    endCard.hidden = false;
    controls.classList.remove('vp-hidden');
    if (!blocking) fireComplete();
  });

  /* ---- Progress ---- */
  video.addEventListener('timeupdate', function () {
    if (!video.duration) return;
    var pct = (video.currentTime / video.duration) * 100;
    progressBar.style.width = pct + '%';
    progressWrap.setAttribute('aria-valuenow', Math.round(pct).toString());
    timeEl.textContent = fmt(video.currentTime) + ' / ' + fmt(video.duration);
    if (parsed.length) highlightCue();
    if (blocking && !fired && pct >= 95) fireComplete();
  });

  progressWrap.addEventListener('click', function (e) {
    if (!video.duration) return;
    var rect = progressWrap.getBoundingClientRect();
    video.currentTime = video.duration * ((e.clientX - rect.left) / rect.width);
  });

  progressWrap.addEventListener('keydown', function (e) {
    if (!video.duration) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); video.currentTime = Math.min(video.duration, video.currentTime + 5); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); video.currentTime = Math.max(0, video.currentTime - 5); }
  });

  /* ---- Mute ---- */
  muteBtn.addEventListener('click', function () {
    video.muted = !video.muted;
    muteBtn.innerHTML = video.muted ? I_MUTED : I_VOL;
    muteBtn.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute');
  });

  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'kbf:mute') {
      video.muted = true;
      muteBtn.innerHTML = I_MUTED;
      muteBtn.setAttribute('aria-label', 'Unmute');
    }
  });

  /* ---- CC ---- */
  ccBtn.addEventListener('click', function () {
    var on = ccBtn.getAttribute('aria-pressed') === 'true';
    ccBtn.setAttribute('aria-pressed', String(!on));
    ccBtn.classList.toggle('vp-btn--active', !on);
    if (video.textTracks[0]) video.textTracks[0].mode = on ? 'hidden' : 'showing';
  });

  /* ---- Fullscreen ---- */
  // Fullscreening an element inside a shadow root is allowed, but
  // `document.fullscreenElement` reports the shadow *host*, not the wrapper in this root,
  // so it can only be read as a yes/no test — never compared against a local element.
  // Driving the icon off `fullscreenchange` rather than the click also fixes it sticking
  // on "Exit fullscreen" when the learner leaves fullscreen with Escape.
  var fsTarget = root.querySelector('#vp-wrapper');

  function syncFsButton() {
    var on = !!document.fullscreenElement;
    fsBtn.innerHTML = on ? I_EFS : I_FS;
    fsBtn.setAttribute('aria-label', on ? 'Exit fullscreen' : 'Fullscreen');
  }

  fsBtn.addEventListener('click', function () {
    if (!document.fullscreenElement) {
      if (fsTarget.requestFullscreen) {
        var req = fsTarget.requestFullscreen();
        // Rejects when the embedding frame withholds the fullscreen permission, which
        // some LMS players do. Swallowed so it isn't an unhandled rejection.
        if (req && req.catch) req.catch(function () {});
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', syncFsButton);

  /* ---- Replay ---- */
  replayBtn.addEventListener('click', function () {
    endCard.hidden = true;
    video.currentTime = 0;
    video.play();
  });

  /* ---- Auto-hide controls ---- */
  var hideTimer;
  function resetHideTimer() {
    clearTimeout(hideTimer);
    controls.classList.remove('vp-hidden');
    if (!video.paused) {
      hideTimer = setTimeout(function () { controls.classList.add('vp-hidden'); }, 3000);
    }
  }
  stage.addEventListener('mousemove', resetHideTimer);
  stage.addEventListener('focus', resetHideTimer, true);

  /* ---- Transcript ---- */
  var parsed = [];

  if (vttUrl && showTranscript) {
    transcriptBar.style.display = '';
    transcriptToggle.addEventListener('click', function () {
      var open = transcriptToggle.getAttribute('aria-expanded') === 'true';
      transcriptToggle.setAttribute('aria-expanded', String(!open));
      transcriptToggle.textContent = open ? 'Show Transcript' : 'Hide Transcript';
      transcriptPanel.hidden = open;
      if (!open && parsed.length === 0) fetchTranscript();
    });
  }

  function fetchTranscript() {
    fetch(vttUrl).then(function (r) { return r.text(); }).then(function (txt) {
      parsed = parseVtt(txt);
      buildCueList();
    }).catch(function () {});
  }

  function buildCueList() {
    cueList.innerHTML = '';
    parsed.forEach(function (cue, idx) {
      var li = document.createElement('li');
      li.className = 'vp-cue';
      li.dataset.idx = String(idx);
      var t = document.createElement('span');
      t.className = 'vp-cue-time';
      t.textContent = fmt(cue.start);
      t.setAttribute('aria-hidden', 'true');
      var s = document.createElement('span');
      s.textContent = cue.text;
      li.appendChild(t);
      li.appendChild(s);
      li.addEventListener('click', function () { video.currentTime = cue.start; });
      cueList.appendChild(li);
    });
  }

  function highlightCue() {
    var t = video.currentTime;
    var items = cueList.querySelectorAll('.vp-cue');
    items.forEach(function (li) {
      var cue = parsed[parseInt(li.dataset.idx, 10)];
      var active = cue && t >= cue.start && t < cue.end;
      var wasActive = li.classList.contains('vp-cue--active');
      li.classList.toggle('vp-cue--active', active);
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
