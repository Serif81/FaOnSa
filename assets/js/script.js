window.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('#faonsa-rondell .faonsa-swiper');
  if (!root) return;

  const swiper = new Swiper(root, {
    centeredSlides: true,
    loop: true,
    speed: 450,
    spaceBetween: 60,                 // mehr Abstand -> kein Überlappen
    slidesPerView: 3,
    navigation: {
      nextEl: '#faonsa-rondell .faonsa-next',
      prevEl: '#faonsa-rondell .faonsa-prev',
    },
    slideToClickedSlide: true,
    breakpoints: {
      0:   { slidesPerView: 1, spaceBetween: 16 },
      640: { slidesPerView: 2, spaceBetween: 32 },
      900: { slidesPerView: 3, spaceBetween: 60 },
    },
  });

  window._r = swiper;
});
