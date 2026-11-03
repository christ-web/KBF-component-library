KBF.define(function (root, kbf) {
  'use strict';
  var c = kbf.config;

  var titleEl    = root.querySelector('#cf-title');
  var subtitleEl = root.querySelector('#cf-subtitle');
  var canvas     = root.querySelector('#cf-canvas');

  titleEl.textContent    = c.title    ? String(c.title)    : 'Congratulations!';
  subtitleEl.textContent = c.subtitle ? String(c.subtitle) : '';
  if (!c.subtitle) subtitleEl.style.display = 'none';

  var COLORS = ['#d13447', '#ffbf00', '#263672', '#0ea5e9', '#22c55e', '#f97316'];

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReduced) {
    for (var i = 0; i < 150; i++) {
      var piece = document.createElement('div');
      piece.className = 'cf-piece';

      var w = Math.floor(Math.random() * 8) + 4;
      var l = Math.floor(Math.random() * 100);
      var delay = Math.random() * 3;
      var duration = 4 + Math.random() * 2;
      var color = COLORS[Math.floor(Math.random() * COLORS.length)];
      var rotate = Math.floor(Math.random() * 360);
      var leftEnd = l + Math.floor(Math.random() * 15);

      piece.style.cssText = [
        'width:' + w + 'px',
        'height:' + Math.floor(w * 0.4) + 'px',
        'background-color:' + color,
        'left:' + l + '%',
        'opacity:' + (Math.random() + 0.5),
        'transform:rotate(' + rotate + 'deg)'
      ].join(';');

      canvas.appendChild(piece);

      // Was 150 `<style>` elements appended to `document.head`, each holding one
      // `@keyframes cf-drop-<i>`. A shadow-contained element can't see document-level
      // keyframes, so that stopped animating entirely once this component moved into a
      // shadow root. The 150 rules only ever differed by their end position, so the Web
      // Animations API expresses the same thing per element with no stylesheet at all.
      piece.animate(
        [
          { top: '-10%', left: l + '%' },
          { top: '110%', left: leftEnd + '%' }
        ],
        {
          duration: duration * 1000,
          delay: delay * 1000,
          iterations: Infinity,
          easing: 'linear'
        }
      );
    }
  }

  kbf.complete();
});
