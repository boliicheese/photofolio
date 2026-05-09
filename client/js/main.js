import '../css/main.css';
import './nav.js';

if (document.getElementById('gallery-data')) {
  import('./lightbox.js');
}

if (document.querySelectorAll('.hero__slide').length > 1) {
  import('./carousel.js');
}

document.addEventListener('contextmenu', (e) => {
  if (e.target.closest('.gallery-grid, .hero, .lightbox')) e.preventDefault();
});
