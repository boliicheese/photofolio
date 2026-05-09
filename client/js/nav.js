// Scroll-based hero nav behaviour
const nav = document.getElementById('site-nav');
if (nav && nav.classList.contains('nav--hero')) {
  const onScroll = () => nav.classList.toggle('nav--scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Hamburger toggle — works for both public nav and admin nav
function initBurger(burgerId, linksId, navId) {
  const burger = document.getElementById(burgerId);
  const links  = document.getElementById(linksId);
  const navEl  = document.getElementById(navId);
  if (!burger || !links) return;

  burger.addEventListener('click', () => {
    const open = navEl.classList.toggle('nav--open');
    burger.setAttribute('aria-expanded', String(open));
  });

  // Close when a link is tapped on mobile
  links.addEventListener('click', (e) => {
    if (e.target.closest('a, button[type="submit"]') && window.innerWidth <= 640) {
      navEl.classList.remove('nav--open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });
}

initBurger('nav-burger', 'nav-links', 'site-nav');
initBurger('admin-nav-burger', 'admin-nav-links', 'admin-nav');
