const nav = document.getElementById('site-nav');
if (nav && nav.classList.contains('nav--hero')) {
  const onScroll = () => nav.classList.toggle('nav--scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
