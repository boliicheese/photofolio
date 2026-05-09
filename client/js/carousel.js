const slides = document.querySelectorAll('.hero__slide');
if (slides.length < 2) throw new Error('carousel: not enough slides');

let current = 0;
let timer = null;
let transitioning = false;

function goTo(idx) {
  if (transitioning) return;
  transitioning = true;
  slides[current].classList.remove('is-active');
  current = ((idx % slides.length) + slides.length) % slides.length;
  slides[current].classList.add('is-active');
  document.querySelectorAll('.hero__dot').forEach((d, i) => d.classList.toggle('is-active', i === current));
  setTimeout(() => { transitioning = false; }, 650);
}

function next() { goTo(current + 1); }
function prev() { goTo(current - 1); }

function startTimer() {
  clearInterval(timer);
  timer = setInterval(next, 5000);
}

startTimer();

document.getElementById('hero-prev')?.addEventListener('click', () => { prev(); startTimer(); });
document.getElementById('hero-next')?.addEventListener('click', () => { next(); startTimer(); });

const hero = document.querySelector('.hero');
hero?.addEventListener('mouseenter', () => clearInterval(timer));
hero?.addEventListener('mouseleave', startTimer);

let touchX = 0;
hero?.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].screenX; }, { passive: true });
hero?.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].screenX - touchX;
  if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); startTimer(); }
}, { passive: true });
