/**
 * The page's only script, as a string. Four jobs, no dependencies, no build.
 *
 *   routing    `#/<category>` and `#/<category>/<product>` show exactly one
 *              `[data-page]` and hide the rest — one product per screen, with
 *              the back button and a copyable deep link for free
 *   rail       the category picker swaps which outline is shown; the button
 *              opens it; Escape and an outside click close it
 *   gallery    a thumbnail drives the big viewer and rebuilds its caption from
 *              the `data-*` on the thumb, so nothing is duplicated
 *   language   one attribute on `<html>` decides which `data-lang` copy is
 *              visible; both languages are already in the DOM
 *
 * Written without template literals on purpose: this string is itself inside a
 * TypeScript template literal, and `${` in here would be interpolated by the
 * generator rather than reaching the browser.
 */
export const CLIENT = `
(function () {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  var pages = {};
  var order = [];
  document.querySelectorAll('[data-page]').forEach(function (el) {
    pages[el.dataset.page] = el;
    order.push(el.dataset.page);
  });

  var select = document.querySelector('[data-category-select]');
  var outline = document.querySelector('[data-outline]');
  var toggle = document.querySelector('[data-menu-toggle]');
  var panels = document.querySelectorAll('[data-outline-for]');
  var links = document.querySelectorAll('[data-route]');

  // --- language ------------------------------------------------------------
  var lang = 'it';
  function setLanguage(next) {
    lang = next;
    document.documentElement.setAttribute('data-lang', next);
    document.querySelectorAll('[data-lang-set]').forEach(function (button) {
      button.classList.toggle('on', button.dataset.langSet === next);
    });
    var active = document.querySelector('[data-page]:not([hidden]) [data-gallery]');
    if (active) paint(active, active.querySelector('.thumb.on') || active.querySelector('.thumb'));
  }
  document.querySelectorAll('[data-lang-set]').forEach(function (button) {
    button.addEventListener('click', function () { setLanguage(button.dataset.langSet); });
  });

  // --- gallery -------------------------------------------------------------
  function dimensions(node, image) {
    function write() {
      if (!image.naturalWidth) return;
      node.textContent = image.naturalWidth + '×' + image.naturalHeight;
    }
    if (image.complete) write();
    else image.addEventListener('load', write, { once: true });
  }

  function paint(gallery, thumb) {
    if (!thumb) return;
    gallery.querySelectorAll('.thumb').forEach(function (other) {
      other.classList.toggle('on', other === thumb);
    });

    var viewer = gallery.querySelector('[data-viewer]');
    var caption = gallery.querySelector('[data-caption]');
    var data = thumb.dataset;
    viewer.innerHTML = '';
    caption.innerHTML = '';

    var facts = document.createElement('span');
    facts.className = 'caption-facts';
    facts.textContent = data.role + ' · ' + data.file;

    if (data.missing) {
      var absent = document.createElement('div');
      absent.className = 'viewer-missing';
      absent.innerHTML = '<strong>file missing</strong><code>' + data.file + '</code><span>' + data.path + '</span>';
      viewer.appendChild(absent);
      caption.appendChild(facts);
      return;
    }

    if (data.kind === 'image') {
      var image = document.createElement('img');
      image.src = data.src;
      image.alt = data.altIt || '';
      viewer.appendChild(image);
      var size = document.createElement('span');
      size.className = 'caption-dims';
      facts.textContent = data.role + ' · ' + data.file + ' · ' + data.size + ' · ';
      facts.appendChild(size);
      dimensions(size, image);
    } else if (data.kind === 'video') {
      var video = document.createElement('video');
      video.src = data.src;
      video.controls = true;
      video.preload = 'metadata';
      viewer.appendChild(video);
      facts.textContent = data.role + ' · ' + data.file + ' · ' + data.size;
    } else {
      var link = document.createElement('a');
      link.className = 'viewer-doc';
      link.href = data.src;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = 'Open ' + data.file;
      viewer.appendChild(link);
      facts.textContent = data.role + ' · ' + data.file + ' · ' + data.size;
    }

    caption.appendChild(facts);

    var alt = lang === 'en' ? data.altEn || data.altIt : data.altIt;
    var note = document.createElement('span');
    if (alt) {
      note.className = 'caption-alt';
      note.textContent = 'alt · ' + alt;
    } else if (data.kind === 'image') {
      note.className = 'caption-alt none';
      note.textContent = 'no alt text';
    }
    if (note.className) caption.appendChild(note);
  }

  document.querySelectorAll('[data-gallery]').forEach(function (gallery) {
    gallery.querySelectorAll('.thumb').forEach(function (thumb) {
      thumb.addEventListener('click', function () { paint(gallery, thumb); });
    });
    paint(gallery, gallery.querySelector('.thumb'));
  });

  // --- rail ----------------------------------------------------------------
  function showOutline(code) {
    panels.forEach(function (panel) { panel.hidden = panel.dataset.outlineFor !== code; });
    if (select && select.value !== code && pages[code]) select.value = code;
  }
  function setMenu(open) {
    outline.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  }
  toggle.addEventListener('click', function () { setMenu(outline.hidden); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') setMenu(false);
  });
  document.addEventListener('click', function (event) {
    if (!outline.hidden && !event.target.closest('.chrome-left')) setMenu(false);
  });
  if (select) {
    select.addEventListener('change', function () {
      showOutline(select.value);
      location.hash = '#/' + select.value;
      setMenu(true);
    });
  }
  links.forEach(function (link) {
    link.addEventListener('click', function () { setMenu(false); });
  });

  // --- routing -------------------------------------------------------------
  function show() {
    var raw = decodeURIComponent(location.hash.replace(/^#\\/?/, ''));
    var name = pages[raw] ? raw : order[0];
    var target = pages[name];

    order.forEach(function (key) { pages[key].hidden = key !== name; });
    document.title = (target.dataset.title || 'Catalogue') + ' · Catalogue preview';
    showOutline(name.split('/')[0]);

    links.forEach(function (link) {
      link.classList.toggle('on', link.dataset.route === name);
    });

    var gallery = target.querySelector('[data-gallery]');
    if (gallery) paint(gallery, gallery.querySelector('.thumb.on') || gallery.querySelector('.thumb'));
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', show);
  setLanguage('it');
  show();
})();
`;
