import { addPhotos } from './lightbox.js';

const btn  = document.getElementById('load-more-btn');
const grid = document.getElementById('gallery-grid');
if (!btn || !grid) throw new Error('gallery-more: missing elements');

const labelLoad   = btn.dataset.label   || 'Ver más fotos';
const labelWait   = btn.dataset.loading || 'Cargando…';
const viewLabel   = grid.dataset.viewPhotoLabel || 'Ver foto';

btn.addEventListener('click', async () => {
  const offset = parseInt(btn.dataset.offset, 10);
  btn.disabled = true;
  btn.textContent = labelWait;

  let data;
  try {
    const res = await fetch(`/gallery/more?offset=${offset}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch {
    btn.disabled = false;
    btn.textContent = labelLoad;
    return;
  }

  data.photos.forEach((photo, i) => {
    const idx   = offset + i;
    const ratio = photo.originalWidth && photo.originalHeight
      ? `${photo.originalWidth}/${photo.originalHeight}`
      : '3/2';

    const el = document.createElement('button');
    el.className = 'gallery-item';
    el.dataset.index = idx;
    el.setAttribute('aria-label', photo.title || viewLabel);
    el.style.setProperty('--ar-ratio', ratio);
    el.innerHTML = `<img class="gallery-item__img" src="${photo.thumbUrl}" alt="${photo.title || ''}" loading="lazy" draggable="false">`;
    grid.appendChild(el);
  });

  addPhotos(data.photos);
  btn.dataset.offset = offset + data.photos.length;

  if (data.hasMore) {
    btn.disabled = false;
    btn.textContent = labelLoad;
  } else {
    document.getElementById('gallery-more')?.remove();
  }
});
