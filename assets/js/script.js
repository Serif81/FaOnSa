// === FAONSA RONDELL (Bild-Karussell, Swiper) ===
window.addEventListener('DOMContentLoaded', () => {
  const sel = '#faonsa-rondell .faonsa-swiper';
  const root = document.querySelector(sel);
  if (!root || typeof Swiper !== 'function') return; // kein Karussell auf der Seite oder Swiper nicht geladen

  new Swiper(root, {
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
});
