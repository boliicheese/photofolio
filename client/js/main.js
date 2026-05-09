import '../css/main.css';
import './nav.js';

// Lightbox only on gallery pages
if (document.getElementById('gallery-data')) {
  import('./lightbox.js');
}

// Block right-click on photos
document.addEventListener('contextmenu', (e) => {
  if (e.target.closest('.gallery-grid, .hero, .lightbox')) {
    e.preventDefault();
  }
});
