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

const imgWrap = lb.querySelector('.lightbox__img-wrap');
const img     = lb.querySelector('.lightbox__img');
const titleEl = lb.querySelector('.lightbox__title');
const locEl   = lb.querySelector('.lightbox__location');
const dateEl  = lb.querySelector('.lightbox__date');
const countEl = lb.querySelector('.lightbox__counter');

// ── Zoom / pan state ───────────────────────────────────────────────────────
let scale  = 1;
let panX   = 0;
let panY   = 0;

function applyTransform() {
  img.style.transform = `scale(${scale}) translate(${panX / scale}px, ${panY / scale}px)`;
}

function resetZoom() {
  scale = 1; panX = 0; panY = 0;
  img.style.transition = 'transform 0.2s ease-out';
  applyTransform();
  setTimeout(() => { img.style.transition = ''; }, 200);
}

// ── Fetch / render ─────────────────────────────────────────────────────────
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
  img.style.transform = '';
  scale = 1; panX = 0; panY = 0;
  img.alt             = p.title || '';
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

// ── Touch gestures ─────────────────────────────────────────────────────────
let touchStartX = 0;
let touchStartY = 0;
let pinchStartDist = 0;
let pinchStartScale = 1;
let panStartX = 0;
let panStartY = 0;
let panOriginX = 0;
let panOriginY = 0;
let isPinching = false;

function getTouchDist(touches) {
  const dx = touches[1].clientX - touches[0].clientX;
  const dy = touches[1].clientY - touches[0].clientY;
  return Math.hypot(dx, dy);
}

function clampPan(s) {
  // how many px the image overflows the wrap at this scale
  const overflowX = Math.max(0, (imgWrap.clientWidth  * (s - 1)) / 2);
  const overflowY = Math.max(0, (imgWrap.clientHeight * (s - 1)) / 2);
  panX = Math.max(-overflowX, Math.min(overflowX, panX));
  panY = Math.max(-overflowY, Math.min(overflowY, panY));
}

imgWrap.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    isPinching = false;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    panStartX = e.touches[0].clientX;
    panStartY = e.touches[0].clientY;
    panOriginX = panX;
    panOriginY = panY;
  } else if (e.touches.length === 2) {
    isPinching = true;
    pinchStartDist  = getTouchDist(e.touches);
    pinchStartScale = scale;
    e.preventDefault();
  }
}, { passive: false });

imgWrap.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2 && isPinching) {
    e.preventDefault();
    const dist     = getTouchDist(e.touches);
    const newScale = Math.min(3, Math.max(1, pinchStartScale * (dist / pinchStartDist)));
    scale = newScale;
    clampPan(scale);
    applyTransform();
  } else if (e.touches.length === 1 && scale > 1) {
    // pan while zoomed
    e.preventDefault();
    panX = panOriginX + (e.touches[0].clientX - panStartX);
    panY = panOriginY + (e.touches[0].clientY - panStartY);
    clampPan(scale);
    applyTransform();
  }
}, { passive: false });

imgWrap.addEventListener('touchend', (e) => {
  if (isPinching && e.touches.length < 2) {
    isPinching = false;
    // snap back if nearly at 1×
    if (scale < 1.1) resetZoom();
    return;
  }

  if (scale > 1) return; // don't navigate while zoomed

  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
    dx < 0 ? next() : prev();
  }
});

// ── Keyboard & click events ────────────────────────────────────────────────
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
