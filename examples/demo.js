// Demo wiring only: the snackbar trigger. showSnackbar comes from dist/md3-expressive.js.
document.addEventListener('click', function (ev) {
  if (ev.target.closest('[data-demo-snack]')) {
    showSnackbar('Watchlist deleted', { label: 'Undo', onAction: function () {} });
  }
});
