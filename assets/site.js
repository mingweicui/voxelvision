// voxelvision.app — shared behaviour. Loaded with `defer`.
(function () {
  // <details> gives open/close and keyboard support for free; these cover the two
  // gestures the element itself does not.
  var m = document.querySelector('.vvmenu');
  if (!m) return;
  document.addEventListener('click', function (e) { if (!m.contains(e.target)) m.open = false; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') m.open = false; });
  m.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { m.open = false; });
  });
})();

(function () {
  var toc = document.querySelector('.vvtoc');
  if (!toc) return;

  // Wide: the rail is always shown, so <details> must stay open. Narrow: it is a
  // disclosure and starts closed, so it costs no vertical space until asked for.
  // With scripting off the markup's own `open` leaves it expanded — reachable,
  // just not collapsible.
  var wide = window.matchMedia('(min-width: 1101px)');
  function sync() { toc.open = wide.matches; }
  sync();
  wide.addEventListener('change', sync);

  var links = [].slice.call(toc.querySelectorAll('a[href^="#"]'));
  var targets = links
    .map(function (a) { return { a: a, el: document.getElementById(a.hash.slice(1)) }; })
    .filter(function (t) { return t.el; });
  if (!targets.length) return;

  function mark(el) {
    links.forEach(function (a) { a.classList.toggle('is-current', a === el); });
  }

  // Highlight the section whose start is nearest above the reading line.
  var ticking = false;
  function update() {
    ticking = false;
    var line = window.innerHeight * 0.28, best = null;
    targets.forEach(function (t) {
      if (t.el.getBoundingClientRect().top <= line) best = t.a;
    });
    mark(best || targets[0].a);
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();

  // On narrow the rail floats over the text, so it dismisses like the bar's menu:
  // on an entry, on an outside tap, or on Escape.
  links.forEach(function (a) {
    a.addEventListener('click', function () { if (!wide.matches) toc.open = false; });
  });
  document.addEventListener('click', function (e) {
    if (!wide.matches && !toc.contains(e.target)) toc.open = false;
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !wide.matches) toc.open = false;
  });
})();
