// === FAONSA RONDELL – Minimal & Debug ===
window.addEventListener('DOMContentLoaded', () => {
  const sel = '#faonsa-rondell .faonsa-swiper';
  const root = document.querySelector(sel);
  if (!root) { console.warn('Swiper-Root nicht gefunden:', sel); return; }

  console.log('Swiper verfügbar?', typeof Swiper); // sollte "function" sein

  const swiper = new Swiper(root, {
    // Basis
    loop: true,
    speed: 450,
    slidesPerView: 3,
    slidesPerGroup: 1,
    spaceBetween: 48,
    centeredSlides: true,

    // Navigation
    navigation: {
      nextEl: '#faonsa-rondell .faonsa-next',
      prevEl: '#faonsa-rondell .faonsa-prev',
    },
    pagination: {
      el: '#faonsa-rondell .faonsa-pag',
      clickable: true,
    },

    // KEIN Klick-ins-Bild zum Springen (vermeidet "3 cm daneben"-Effekt)
    slideToClickedSlide: false,

    // Breakpoints
    breakpoints: {
      0:   { slidesPerView: 1, slidesPerGroup: 1, spaceBetween: 14, centeredSlides: true, centeredSlidesBounds: true },
      640: { slidesPerView: 2, slidesPerGroup: 1, spaceBetween: 24, centeredSlides: true },
      900: { slidesPerView: 3, slidesPerGroup: 1, spaceBetween: 48, centeredSlides: true },
    },
  });

  // Debug: Pfeil-Klicks & Methode testbar machen
  window._faonsaSwiper = swiper;
  document.querySelector('#faonsa-rondell .faonsa-next')?.addEventListener('click', () => console.log('>> next'));
  document.querySelector('#faonsa-rondell .faonsa-prev')?.addEventListener('click', () => console.log('<< prev'));
  console.log('Swiper init:', swiper?.slides?.length, 'slides');
});
