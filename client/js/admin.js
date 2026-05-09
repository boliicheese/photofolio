const i18nEl = document.getElementById('admin-i18n');
const i18n = i18nEl ? JSON.parse(i18nEl.textContent) : {};

// ── Photo list: edit / delete ──────────────────────────────────────────────
document.querySelectorAll('.js-edit-photo').forEach((btn) => {
  btn.addEventListener('click', () => {
    const row  = btn.closest('.photo-row');
    const form = row.querySelector('.js-photo-edit-form');
    const open = form.hidden;
    form.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  });
});

document.querySelectorAll('.js-cancel-edit').forEach((btn) => {
  btn.addEventListener('click', () => {
    const form = btn.closest('.js-photo-edit-form');
    form.hidden = true;
    form.closest('.photo-row').querySelector('.js-edit-photo')?.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('.js-photo-edit-form').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = form.dataset.id;
    const data = Object.fromEntries(new FormData(form));
    if (!data.featured) data.featured = 'false';

    const res = await fetch(`/admin/photos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) window.location.reload();
    else alert(i18n.errSave || 'Error al guardar.');
  });
});

document.querySelectorAll('.js-delete-photo').forEach((btn) => {
  btn.addEventListener('click', async () => {
    if (!confirm(i18n.confirmDelete || '¿Eliminar esta foto?')) return;
    const row = btn.closest('.photo-row');
    const id  = row.dataset.id;
    const res = await fetch(`/admin/photos/${id}`, { method: 'DELETE' });
    if (res.ok) row.remove();
    else alert(i18n.errDelete || 'Error al eliminar.');
  });
});

// ── Submissions: mark read ─────────────────────────────────────────────────
document.querySelectorAll('.js-mark-read').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const id  = btn.dataset.id;
    const res = await fetch(`/admin/submissions/${id}/read`, { method: 'PATCH' });
    if (res.ok) {
      const item = btn.closest('.submission-item');
      item.classList.remove('submission-item--unread');
      btn.remove();
      item.querySelector('.unread-dot')?.remove();
    }
  });
});

// ── Collections ────────────────────────────────────────────────────────────
const newBtn    = document.getElementById('new-collection-btn');
const newForm   = document.getElementById('new-collection-form');
const cancelNew = document.getElementById('cancel-new-collection');

newBtn?.addEventListener('click', () => { newForm.hidden = false; newForm.querySelector('input').focus(); });
cancelNew?.addEventListener('click', () => { newForm.hidden = true; newForm.reset(); });

newForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(newForm));
  const res = await fetch('/admin/collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.ok) window.location.reload();
  else alert(i18n.errCreateCollection || 'Error al crear colección.');
});

document.querySelectorAll('.js-delete-collection').forEach((btn) => {
  btn.addEventListener('click', async () => {
    if (!confirm(i18n.confirmDeleteCollection || '¿Eliminar esta colección?')) return;
    const id  = btn.dataset.id;
    const res = await fetch(`/admin/collections/${id}`, { method: 'DELETE' });
    if (res.ok) btn.closest('.collection-row').remove();
    else alert(i18n.errDeleteCollection || 'Error al eliminar.');
  });
});

// ── Carousel admin ─────────────────────────────────────────────────────────
const carouselSlots = document.querySelector('.carousel-slots');
if (carouselSlots) {
  const picker      = document.getElementById('photo-picker');
  const pickerTitle = document.getElementById('picker-title');
  const pickerClose = document.getElementById('picker-close');
  const backdrop    = document.getElementById('picker-backdrop');
  let activePos = null;

  document.querySelectorAll('.js-pick-slot').forEach((btn) => {
    btn.addEventListener('click', () => {
      activePos = Number(btn.closest('.carousel-slot').dataset.position);
      const label = pickerTitle.dataset.label || 'Foto para posición';
      pickerTitle.textContent = `${label} ${activePos}`;
      picker.hidden = false;
    });
  });

  const closePicker = () => { picker.hidden = true; activePos = null; };
  pickerClose?.addEventListener('click', closePicker);
  backdrop?.addEventListener('click', closePicker);

  document.querySelectorAll('.picker-item').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!activePos) return;
      const photoId = btn.dataset.id;
      const res = await fetch(`/admin/carousel/${activePos}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      });
      closePicker();
      if (res.ok) window.location.reload();
      else alert(i18n.errAssign || 'Error al asignar foto.');
    });
  });

  document.querySelectorAll('.js-remove-slot').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const pos = Number(btn.closest('.carousel-slot').dataset.position);
      const res = await fetch(`/admin/carousel/${pos}`, { method: 'DELETE' });
      if (res.ok) window.location.reload();
      else alert(i18n.errRemove || 'Error al quitar foto.');
    });
  });
}
