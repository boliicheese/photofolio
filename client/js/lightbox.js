const dataEl = document.getElementById('gallery-data');
if (!dataEl) throw new Error('No gallery data');

const photos  = JSON.parse(dataEl.textContent);
const cache   = new Map(); // id → presigned url
const lang    = document.documentElement.lang || 'es';
let current   = 0;

// ── Build DOM ──────────────────────────────────────────────────────────────
const lb = document.createElement('div');
lb.className = 'lightbox';
lb.setAttribute('role', 'dialog');
lb.setAttribute('aria-modal', 'true');
lb.innerHTML = `
  <button class="lightbox__close" aria-label="Cerrar">✕</button>
  <button class="lightbox__btn lightbox__prev" aria-label="Anterior">&#8592;</button>
  <button class="lightbox__btn lightbox__next" aria-label="Siguiente">&#8594;</button>
  <div class="lightbox__img-wrap">
    <img class="lightbox__img" src="" alt="">
    <div class="lightbox__meta">
      <span class="lightbox__title"></span>
      <span class="lightbox__location"></span>
      <span class="lightbox__date"></span>
      <span class="lightbox__counter"></span>
    </div>
  </div>
`;
document.body.appendChild(lb);

const img     = lb.querySelector('.lightbox__img');
const titleEl = lb.querySelector('.lightbox__title');
const locEl   = lb.querySelector('.lightbox__location');
const dateEl  = lb.querySelector('.lightbox__date');
const countEl = lb.querySelector('.lightbox__counter');

async function fetchUrl(id) {
  if (cache.has(id)) return cache.get(id);
  const res = await fetch(`/api/photos/${id}/original`);
  const { url } = await res.json();
  cache.set(id, url);
  return url;
}

async function render() {
  const p = photos[current];
  img.src = '';
  img.alt         = p.title || '';
  titleEl.textContent = p.title || '';
  locEl.textContent   = p.location || '';
  dateEl.textContent  = p.shotAt
    ? new Date(p.shotAt + 'T00:00:00').toLocaleDateString(
        lang === 'es' ? 'es-PA' : 'en-US',
        { year: 'numeric', month: 'long' }
      )
    : '';
  countEl.textContent = `${current + 1} / ${photos.length}`;

  const url = await fetchUrl(p.id);
  if (photos[current]?.id === p.id) img.src = url;
}

function open(idx) {
  current = idx;
  render();
  lb.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  lb.querySelector('.lightbox__close').focus();
}

function close() {
  lb.classList.remove('is-open');
  document.body.style.overflow = '';
}

function prev() { current = (current - 1 + photos.length) % photos.length; render(); }
function next() { current = (current + 1) % photos.length; render(); }

// ── Events ─────────────────────────────────────────────────────────────────
lb.querySelector('.lightbox__close').addEventListener('click', close);
lb.querySelector('.lightbox__prev').addEventListener('click', prev);
lb.querySelector('.lightbox__next').addEventListener('click', next);
lb.addEventListener('click', (e) => { if (e.target === lb) close(); });

document.addEventListener('keydown', (e) => {
  if (!lb.classList.contains('is-open')) return;
  if (e.key === 'Escape')     close();
  if (e.key === 'ArrowLeft')  prev();
  if (e.key === 'ArrowRight') next();
});

// Event delegation — works for dynamically added items too
document.getElementById('gallery-grid')?.addEventListener('click', (e) => {
  const item = e.target.closest('.gallery-item');
  if (!item) return;
  open(parseInt(item.dataset.index, 10));
});

export function addPhotos(newPhotos) {
  photos.push(...newPhotos);
}

export { open, close };
