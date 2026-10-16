(function () {
  var MAP = {
    producthunt: 'producthunt',
    peerpush: 'peerpush',
    un:       'uneed',
    at:       'alternativeto',
    // Preserve earlier distribution links and provider aliases.
    ph:       'producthunt',
    pp:       'peerpush',
    uneed:    'uneed',
    alternativeto: 'alternativeto',
    dir:      'directories',
    li:       'linkedin',
    x:        'x-twitter',
  };
  var ct = MAP[new URLSearchParams(location.search).get('ref')];
  if (!ct) return;
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var a = t.closest('a[href*="apps.apple.com"]');
    if (a) a.href = a.href.replace(/([?&]ct=)[^&]*/, '$1' + ct);
  }, true);
})();
