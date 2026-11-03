KBF.define({ completion: 'auto' }, function (root, kbf) {
  var ICONS = { info: 'ℹ️', tip: '💡', warning: '⚠️', important: '🚨' };
  var q = function(sel) { return root.querySelector(sel); };
  var box = q('.kbf-callout');
  var c = kbf.config;
  var type = (c.type || 'info').toLowerCase();
  box.setAttribute('data-type', type);
  q('.callout-icon').textContent   = ICONS[type] || ICONS.info;
  if (c.headline) q('.callout-headline').innerHTML = c.headline;
  if (c.body)     q('.callout-body').innerHTML     = c.body;
});
