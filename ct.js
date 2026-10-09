(function () {
  var MAP = {
    ph:       'producthunt',
    uneed:    'directories',
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
