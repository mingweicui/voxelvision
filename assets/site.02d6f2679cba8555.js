// voxelvision.app — shared behaviour. Loaded with `defer`.
(function () {
  var images = [].slice.call(document.querySelectorAll('.vvpillars figure img, #modalities figure img'));
  if (!images.length || !window.HTMLDialogElement) return;

  var dialog = document.createElement('dialog');
  dialog.className = 'vvlightbox';
  dialog.setAttribute('aria-label', 'Product screenshots');
  dialog.innerHTML = '<div class="vvlightbox-bar"><p class="vvlightbox-caption" aria-live="polite"></p><div class="vvlightbox-controls"><button type="button" data-action="previous" aria-label="Previous screenshot">←</button><button type="button" data-action="next" aria-label="Next screenshot">→</button><button type="button" data-action="zoom" aria-label="Zoom in" aria-pressed="false">+</button><button type="button" data-action="close" aria-label="Close screenshot viewer">×</button></div></div><div class="vvlightbox-stage"><img class="vvlightbox-image" alt=""></div>';
  dialog.querySelector('.vvlightbox-bar').insertAdjacentHTML('afterbegin', '<span class="vvlightbox-frost" aria-hidden="true"><img alt=""></span>');
  document.body.appendChild(dialog);
  var display = dialog.querySelector('.vvlightbox-image');
  var frostImage = dialog.querySelector('.vvlightbox-frost img');
  var stage = dialog.querySelector('.vvlightbox-stage');
  var caption = dialog.querySelector('.vvlightbox-caption');
  var zoom = dialog.querySelector('[data-action="zoom"]');
  var current = 0, opener, previousOverflow;
  var scale = 1, offsetX = 0, offsetY = 0;
  var pointers = new Map(), gesture, swipe;
  var neighbor, frostNeighbor, dragX = 0, sliding = false, slideToken = 0;
  var slideAnimations = [];
  function clearSlide() {
    slideToken++;
    slideAnimations.forEach(function (animation) { animation.cancel(); });
    slideAnimations = [];
    if (neighbor) neighbor.remove();
    if (frostNeighbor) frostNeighbor.remove();
    neighbor = frostNeighbor = null; dragX = 0; sliding = false;
  }
  function dragSlide(dx) {
    dragX = dx;
    var direction = dx < 0 ? 1 : -1;
    var source = images[(current + direction + images.length) % images.length];
    if (!neighbor) {
      neighbor = document.createElement('img');
      neighbor.className = 'vvlightbox-neighbor'; neighbor.alt = '';
      neighbor.setAttribute('aria-hidden', 'true'); stage.appendChild(neighbor);
      frostNeighbor = document.createElement('img'); frostNeighbor.alt = '';
      frostImage.parentNode.appendChild(frostNeighbor);
    }
    neighbor.src = source.currentSrc || source.src;
    frostNeighbor.src = neighbor.src;
    frostNeighbor.style.width = stage.clientWidth + 'px';
    frostNeighbor.style.height = stage.clientHeight + 'px';
    applyZoom();
    display.style.transform = 'translateX(' + dx + 'px) ' + display.style.transform;
    frostImage.style.transform = display.style.transform;
    neighbor.style.transform = 'translateX(' + (dx + direction * stage.clientWidth) + 'px)';
    frostNeighbor.style.transform = neighbor.style.transform;
  }
  function finishSlide(direction) {
    if (sliding) return;
    if (!neighbor) dragSlide(direction > 0 ? -.01 : .01);
    sliding = true;
    var token = ++slideToken;
    var targetX = direction ? -direction * stage.clientWidth : 0;
    var neighborDirection = dragX < 0 ? 1 : -1;
    var base = 'translate(' + offsetX + 'px,' + offsetY + 'px) scale(' + scale + ')';
    var duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 260;
    [display, frostImage, neighbor, frostNeighbor].forEach(function (image, index) {
      var target = index < 2 ? 'translateX(' + targetX + 'px) ' + base : 'translateX(' + (targetX + neighborDirection * stage.clientWidth) + 'px)';
      slideAnimations.push(image.animate([{ transform: image.style.transform }, { transform: target }], { duration: duration, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' }));
    });
    Promise.all(slideAnimations.map(function (animation) { return animation.finished; })).then(function () {
      if (token !== slideToken) return;
      clearSlide();
      if (direction) show(current + direction);
      else applyZoom();
    }).catch(function (error) {
      // Closing or changing gestures intentionally cancels the old transition.
      if (token !== slideToken) return;
      clearSlide(); applyZoom();
      console.error('Screenshot transition failed', error);
    });
  }
  function icon(button, path) {
    button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + path + '"></path></svg>';
  }
  icon(dialog.querySelector('[data-action="previous"]'), 'M19 12H5 M11 6l-6 6 6 6');
  icon(dialog.querySelector('[data-action="next"]'), 'M5 12h14 M13 6l6 6-6 6');
  icon(dialog.querySelector('[data-action="close"]'), 'M6 6l12 12 M18 6L6 18');

  function applyZoom() {
    var fit = Math.min(stage.clientWidth / (display.naturalWidth || 1), stage.clientHeight / (display.naturalHeight || 1));
    var limitX = Math.max(stage.clientWidth / 2, ((display.naturalWidth || 1) * fit * scale - stage.clientWidth) / 2);
    var limitY = Math.max(stage.clientHeight / 2, ((display.naturalHeight || 1) * fit * scale - stage.clientHeight) / 2);
    offsetX = Math.max(-limitX, Math.min(limitX, offsetX));
    offsetY = Math.max(-limitY, Math.min(limitY, offsetY));
    display.style.transform = 'translate(' + offsetX + 'px,' + offsetY + 'px) scale(' + scale + ')';
    frostImage.style.transform = display.style.transform;
    frostImage.style.width = stage.clientWidth + 'px';
    frostImage.style.height = stage.clientHeight + 'px';
    var enlarged = scale > 1;
    dialog.classList.toggle('is-zoomed', enlarged);
    icon(zoom, enlarged ? 'M5 12h14' : 'M5 12h14 M12 5v14');
    zoom.setAttribute('aria-label', enlarged ? 'Zoom out' : 'Zoom in');
    zoom.setAttribute('aria-pressed', String(enlarged));
  }
  function resetZoom() {
    clearSlide();
    scale = 1; offsetX = offsetY = 0;
    pointers.clear(); gesture = null; swipe = null;
    applyZoom();
  }
  function position() {
    var points = Array.from(pointers.values());
    var rect = stage.getBoundingClientRect();
    var first = points[0], second = points[1] || first;
    return { x: (first.x + second.x) / 2 - rect.left - rect.width / 2,
      y: (first.y + second.y) / 2 - rect.top - rect.height / 2,
      distance: Math.hypot(first.x - second.x, first.y - second.y) };
  }
  function beginGesture() {
    gesture = pointers.size ? { point: position(), scale: scale, x: offsetX, y: offsetY } : null;
  }
  stage.addEventListener('pointerdown', function (event) {
    if (sliding) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) swipe = { x: event.clientX, y: event.clientY, multiple: false };
    else if (swipe) { swipe.multiple = true; clearSlide(); applyZoom(); }
    stage.setPointerCapture(event.pointerId);
    beginGesture();
  });
  stage.addEventListener('pointermove', function (event) {
    if (!pointers.has(event.pointerId) || !gesture) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size < 2) {
      if (swipe && !swipe.multiple) {
        var dx = event.clientX - swipe.x, dy = event.clientY - swipe.y;
        if (neighbor || Math.abs(dx) > Math.abs(dy) * 1.5) dragSlide(dx);
      }
      return;
    }
    var point = position();
    scale = gesture.point.distance ? Math.max(.5, Math.min(5, gesture.scale * point.distance / gesture.point.distance)) : gesture.scale;
    var ratio = scale / gesture.scale;
    offsetX = point.x - (gesture.point.x - gesture.x) * ratio;
    offsetY = point.y - (gesture.point.y - gesture.y) * ratio;
    applyZoom();
  });
  stage.addEventListener('pointerup', function (event) {
    if (swipe && !swipe.multiple && pointers.size === 1) {
      var dx = event.clientX - swipe.x, dy = event.clientY - swipe.y;
      var threshold = Math.max(40, Math.min(80, stage.clientWidth * .12));
      if (neighbor) finishSlide(Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.5 ? (dx < 0 ? 1 : -1) : 0);
    }
    pointers.delete(event.pointerId);
    if (!pointers.size) swipe = null;
    beginGesture();
  });
  ['pointercancel', 'lostpointercapture'].forEach(function (name) {
    stage.addEventListener(name, function (event) { pointers.delete(event.pointerId); if (neighbor && !sliding) finishSlide(0); beginGesture(); });
  });
  // Safari gesture events must not zoom the viewport behind the image controls.
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (name) {
    dialog.addEventListener(name, function (event) { event.preventDefault(); }, { passive: false });
  });
  display.addEventListener('load', applyZoom);
  window.addEventListener('resize', function () { if (dialog.open) applyZoom(); });
  function show(index) {
    current = (index + images.length) % images.length;
    resetZoom();
    display.src = images[current].currentSrc || images[current].src;
    frostImage.src = display.src;
    display.alt = images[current].alt;
    caption.textContent = (current + 1) + ' / ' + images.length + ' · ' + images[current].alt;
  }
  images.forEach(function (img, index) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'vvimage-open';
    button.setAttribute('aria-label', 'Enlarge: ' + img.alt);
    button.setAttribute('aria-haspopup', 'dialog');
    var link = img.closest('a');
    if (link) { link.replaceWith(button); button.appendChild(img); }
    else { img.replaceWith(button); button.appendChild(img); }
    button.addEventListener('click', function () {
      opener = button;
      show(index);
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      dialog.showModal();
      applyZoom();
      dialog.querySelector('[data-action="close"]').focus();
    });
  });
  var backdropPress = false;
  dialog.addEventListener('pointerdown', function (event) {
    backdropPress = event.target === dialog;
  });
  dialog.addEventListener('click', function (event) {
    var control = event.target.closest('[data-action]');
    if (!control) { if (event.target === dialog && backdropPress) dialog.close(); backdropPress = false; return; }
    switch (control.dataset.action) {
      case 'previous': finishSlide(-1); break;
      case 'next': finishSlide(1); break;
      case 'close': dialog.close(); break;
      case 'zoom':
        scale = scale > 1 ? 1 : 2;
        offsetX = offsetY = 0;
        applyZoom();
        break;
    }
  });
  dialog.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); finishSlide(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  dialog.addEventListener('close', function () {
    document.documentElement.style.overflow = previousOverflow;
    resetZoom();
    if (opener) opener.focus();
  });
})();
(function () {
  function revealSection() {
    var id = window.location.hash.slice(1);
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    var disclosure = target.closest('details');
    if (disclosure) disclosure.open = true;
    target.scrollIntoView();
  }
  window.addEventListener('hashchange', revealSection);
  revealSection();
})();

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
    a.addEventListener('click', function () {
      var target = document.getElementById(a.hash.slice(1));
      var disclosure = target && target.closest('details');
      if (disclosure) disclosure.open = true;
      if (!wide.matches) toc.open = false;
    });
  });
  document.addEventListener('click', function (e) {
    if (!wide.matches && !toc.contains(e.target)) toc.open = false;
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !wide.matches) toc.open = false;
  });
})();
