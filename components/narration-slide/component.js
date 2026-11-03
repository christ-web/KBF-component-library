KBF.define({ completion: 'auto' }, function (root, kbf) {
  var c = kbf.config;
  var q = function(sel) { return root.querySelector(sel); };
  if (c.headline)       q('.slide-headline').innerHTML = c.headline;
  if (c.on_screen_text) q('.slide-body').innerHTML = c.on_screen_text;
});
