/* Foundation (base, focus ring, icons, helpers) */
// Optional light/dark toggle. Put a pre-paint copy of the first block in <head> to avoid a flash.
(function () {
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch (e) { /* storage blocked: follow the OS */ }

  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-md-theme-toggle]');
    if (!btn) return;
    var dark = root.getAttribute('data-theme') === 'dark' ||
      (!root.hasAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    var next = dark ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    btn.setAttribute('aria-pressed', String(next === 'dark'));
    try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
  });
})();

/* Button group (connected, single or multi select) */
// Single-select: keep aria-pressed in sync on every button of the group.
document.addEventListener('click', function (ev) {
  var btn = ev.target.closest('.md-btn-group > .md-btn');
  if (!btn) return;
  btn.parentElement.querySelectorAll('.md-btn').forEach(function (b) {
    b.setAttribute('aria-pressed', String(b === btn));
  });
});

/* Chips (assist, filter, input, suggestion) */
// Multi-select filter chips. For single-select, clear the others before setting the clicked one.
document.addEventListener('click', function (ev) {
  var chip = ev.target.closest('.md-chip-set > .md-chip[aria-pressed]');
  if (!chip) return;
  chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true'));
});

/* Dialog (basic modal, native <dialog>) */
// Open on [data-md-dialog-open="<dialog id>"], close on [value="cancel"] or a click on the scrim.
document.addEventListener('click', function (ev) {
  var opener = ev.target.closest('[data-md-dialog-open]');
  if (opener) {
    var dlg = document.getElementById(opener.getAttribute('data-md-dialog-open'));
    if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
    return;
  }
  if (ev.target instanceof HTMLDialogElement && ev.target.classList.contains('md-dialog')) {
    // A click on the dialog's own padding also targets the dialog, so only a click outside its box is the scrim.
    var r = ev.target.getBoundingClientRect();
    if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) ev.target.close();
  }
});

/* Snackbar (transient status message with one action) */
// showSnackbar("Saved", { label: "Undo", onAction: fn })
function showSnackbar(message, action) {
  var bar = document.querySelector('.md-snackbar');
  if (!bar) return;
  bar.querySelector('.md-snackbar__text').textContent = message;
  var btn = bar.querySelector('.md-snackbar__action');
  btn.hidden = !action;
  btn.onclick = action ? function () { action.onAction(); bar.hidden = true; } : null;
  if (action) btn.textContent = action.label;
  bar.hidden = false;
  clearTimeout(showSnackbar._t);
  showSnackbar._t = setTimeout(function () { bar.hidden = true; }, action ? 8000 : 5000);
}

/* Tabs (primary, with keyboard arrows) */
// Arrow-key navigation with roving tabindex.
document.addEventListener('keydown', function (ev) {
  var tab = ev.target.closest('.md-tab');
  if (!tab) return;
  var tabs = Array.from(tab.parentElement.querySelectorAll('.md-tab'));
  var i = tabs.indexOf(tab);
  var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[ev.key];
  if (next === undefined) return;
  ev.preventDefault();
  tabs[(next + tabs.length) % tabs.length].click();
  tabs[(next + tabs.length) % tabs.length].focus();
});

document.addEventListener('click', function (ev) {
  var tab = ev.target.closest('.md-tab');
  if (!tab) return;
  tab.parentElement.querySelectorAll('.md-tab').forEach(function (t) {
    var on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    var panel = document.getElementById(t.getAttribute('aria-controls'));
    if (panel) panel.hidden = !on;
  });
});

/* Top app bar (small 64dp, medium 112dp) */
// Tonal bar once the page scrolls under it.
(function () {
  var bar = document.querySelector('.md-top-app-bar');
  if (!bar) return;
  var update = function () {
    if (window.scrollY > 0) bar.setAttribute('data-scrolled', '');
    else bar.removeAttribute('data-scrolled');
  };
  addEventListener('scroll', update, { passive: true });
  update();
})();
