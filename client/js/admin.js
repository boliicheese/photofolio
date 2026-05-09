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
    const editBtn = form.closest('.photo-row').querySelector('.js-edit-photo');
    editBtn?.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('.js-photo-edit-form').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = form.dataset.id;
    const data = Object.fromEntries(new FormData(form));
    // Checkbox unchecked → not present in FormData → send false explicitly
    if (!data.featured) data.featured = 'false';

    const res = await fetch(`/admin/photos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      alert('Error al guardar.');
    }
  });
});

document.querySelectorAll('.js-delete-photo').forEach((btn) => {
  btn.addEventListener('click', async () => {
    if (!confirm('¿Eliminar esta foto? Esta acción no se puede deshacer.')) return;
    const row = btn.closest('.photo-row');
    const id  = row.dataset.id;
    const res = await fetch(`/admin/photos/${id}`, { method: 'DELETE' });
    if (res.ok) row.remove();
    else alert('Error al eliminar.');
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
const newBtn     = document.getElementById('new-collection-btn');
const newForm    = document.getElementById('new-collection-form');
const cancelNew  = document.getElementById('cancel-new-collection');

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
  else alert('Error al crear colección. Verifica que el slug sea único.');
});

document.querySelectorAll('.js-delete-collection').forEach((btn) => {
  btn.addEventListener('click', async () => {
    if (!confirm('¿Eliminar esta colección?')) return;
    const id  = btn.dataset.id;
    const res = await fetch(`/admin/collections/${id}`, { method: 'DELETE' });
    if (res.ok) btn.closest('.collection-row').remove();
    else alert('Error al eliminar.');
  });
});
