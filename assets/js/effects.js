/* =====================================================
   FaOnSa – Scroll-Effekte (ohne Bibliothek)
   Der Intersection Observer setzt nur Klassen. Alle Animationen
   (Fade-in, Slide-in, Schimmer, Glow) laufen als reines CSS
   → siehe "FaOnSa Effekte" am Ende von styles.css.
   ===================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Ohne IntersectionObserver (sehr alte Browser) oder bei "Bewegung reduzieren":
  // alles sofort sichtbar lassen, keine Effekte.
  if (ruhig || !('IntersectionObserver' in window)) return;

  /* ---------- 1. Welche Elemente animiert werden ---------- */
  // Einblenden beim Scrollen (Fade + leichtes Hochgleiten)
  var EINBLENDEN = [
    '.coach-karte', '.angebot-kopf', '.option-karte', '.addon-karte',
    '.versprechen-band', '.ablauf-schritte', '.kpi',
    '.termine-box', '.termin-kacheln li', '.link-card', '.kontakt-box',
    '.section-title', '.kurs-taxi-button', '.web-app-button',
    'main > h2', 'main > h3', 'section > h2', 'section > h3', 'details'
  ].join(',');
  // Edler Schimmer-Effekt beim ersten Sichtbarwerden
  var SCHIMMER = '.option-cta, .kurs-taxi-button, .web-app-button, .option-ribbon';

  document.querySelectorAll(EINBLENDEN).forEach(function (el) {
    if (el.closest('.reveal, header, nav, .nav-drawer, #cookieConsent, .modal')) return;
    el.classList.add('fx');
    // Geschwister in Rastern nacheinander einblenden (Stagger)
    var p = el.parentElement;
    if (p && p.matches('.optionen-grid, .addon-grid, .termin-kacheln, .links-container, .kontakt-fix, .kpi-cards')) {
      el.style.setProperty('--fx-i', Array.prototype.indexOf.call(p.children, el));
    }
  });
  document.querySelectorAll(SCHIMMER).forEach(function (el) { el.classList.add('fx-shimmer'); });

  // Ab hier dürfen die CSS-Startzustände greifen (ohne JS bleibt alles sichtbar)
  root.classList.add('fx-ready');

  /* ---------- 2. Ein Observer für alles ---------- */
  var io = new IntersectionObserver(function (eintraege) {
    eintraege.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible', 'visible'); // "visible" = bestehende .reveal-Klasse
      io.unobserve(e.target);                          // nur einmal animieren – ruhig und performant
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

  document.querySelectorAll('.fx, .fx-shimmer, .reveal').forEach(function (el) { io.observe(el); });
})();
