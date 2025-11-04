window.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('#faonsa-rondell .faonsa-swiper');
  if (!root) return;

  const swiper = new Swiper(root, {
    centeredSlides: true,
    loop: true,
    speed: 450,
    spaceBetween: 60,
    slidesPerView: 3,
    navigation: {
      nextEl: '#faonsa-rondell .faonsa-next',
      prevEl: '#faonsa-rondell .faonsa-prev',
    },
    pagination: {
      el: '#faonsa-rondell .faonsa-pag',
      clickable: true,
    },
    slideToClickedSlide: true,
    breakpoints: {
      // Handy: 1.15 Slides → Nachbarn „schauen rein“
      0:   { slidesPerView: 1.15, spaceBetween: 14, centeredSlides: true },
      // kleines Tablet
      640: { slidesPerView: 2,    spaceBetween: 28, centeredSlides: true },
      // Desktop
      900: { slidesPerView: 3,    spaceBetween: 60, centeredSlides: true },
    },
  });

  window._r = swiper;
});
