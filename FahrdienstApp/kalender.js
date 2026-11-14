/* =====================================================================
   FaOnSa – Kalender-Logik (nicht bearbeiten, Daten stehen in termine.js)
   ---------------------------------------------------------------------
   • 24/7: keine festen Tageszeitfenster
   • Wochenlimit: Summe aller bestätigten Fahrten je Kalenderwoche (Mo–So)
   • Überschneidungsschutz für jedes eingetragene Zeitfenster
   Wird von script.js (Kundenformular) und verwaltung.js (Verwaltung) genutzt.
   ===================================================================== */
const KALENDER = (() => {
  const T = (typeof TERMINE !== "undefined") ? TERMINE : {};
  const LIMIT = Math.round((T.wochenlimitStunden ?? 8) * 60);  // Minuten
  const PUFFER = T.pufferMinuten || 0;
  const zwei = n => String(n).padStart(2, "0");

  const isoLokal = d => `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`;
  const zeitText = d => `${zwei(d.getHours())}:${zwei(d.getMinutes())}`;
  const zuDatum = (iso, hhmm = "00:00") => new Date(`${iso}T${hhmm}:00`);
  const minuten = hhmm => { const [h, m] = String(hhmm).split(":").map(Number); return h * 60 + (m || 0); };

  function mitternachtDanach(d) { const x = new Date(d); x.setHours(24, 0, 0, 0); return x; }
  function wochenStart(d) {                 // Montag 00:00 der Kalenderwoche
    const x = new Date(d); x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  }
  function wocheNach(d) { const x = wochenStart(d); x.setDate(x.getDate() + 7); return x; }
  const wochenSchluessel = d => isoLokal(wochenStart(d));
  function kw(d) {                          // ISO-Kalenderwoche
    const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const tag = x.getUTCDay() || 7;
    x.setUTCDate(x.getUTCDate() + 4 - tag);
    const jahresStart = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
    return { kw: Math.ceil(((x - jahresStart) / 864e5 + 1) / 7), jahr: x.getUTCFullYear() };
  }
  const dauerText = min => `${Math.floor(min / 60)}:${zwei(Math.round(min % 60))} h`;

  /* Fahrt aus termine.js -> { start, ende, minuten, fahrt } */
  function intervall(f) {
    const start = zuDatum(f.datum, f.von);
    let ende;
    if (f.bis) {
      ende = zuDatum(f.datum, f.bis);
      if (ende <= start) ende.setDate(ende.getDate() + 1);   // über Mitternacht
    } else {
      ende = new Date(start.getTime() + minuten(f.dauer || "1:00") * 60000);
    }
    return { start, ende, minuten: (ende - start) / 60000, fahrt: f };
  }

  /* Zerlegt ein Intervall an Grenzen (Mitternacht oder Wochenwechsel) */
  function zerlege(start, ende, naechsteGrenze, schluessel) {
    const teile = [];
    let c = new Date(start);
    while (c < ende) {
      const g = naechsteGrenze(c);
      const bis = g < ende ? g : ende;
      teile.push({ key: schluessel(c), minuten: (bis - c) / 60000 });
      c = bis;
    }
    return teile;
  }
  const proWoche = (s, e) => zerlege(s, e, wocheNach, wochenSchluessel);
  const proTag = (s, e) => zerlege(s, e, mitternachtDanach, isoLokal);

  function alleFahrten() {
    return (T.fahrten || []).filter(f => f && f.datum && f.von).map(intervall).sort((a, b) => a.start - b.start);
  }

  /* Verbrauchte Minuten je Woche / je Tag aus allen bestätigten Fahrten */
  function verbrauch(fahrten = alleFahrten()) {
    const woche = {}, tag = {};
    fahrten.forEach(i => {
      proWoche(i.start, i.ende).forEach(t => (woche[t.key] = (woche[t.key] || 0) + t.minuten));
      proTag(i.start, i.ende).forEach(t => (tag[t.key] = (tag[t.key] || 0) + t.minuten));
    });
    return { woche, tag };
  }

  function wocheInfo(d, v = verbrauch()) {
    const key = wochenSchluessel(d);
    const genutzt = v.woche[key] || 0;
    return { key, genutzt, rest: Math.max(0, LIMIT - genutzt), limit: LIMIT, voll: genutzt >= LIMIT };
  }

  /* Prüft einen gewünschten Zeitraum gegen Kalender und Wochenlimit.
     ignoriere: optional eine Fahrt aus termine.js, die nicht mitgezählt werden soll. */
  function pruefe(start, dauerMin, { ignoriere } = {}) {
    const ende = new Date(start.getTime() + dauerMin * 60000);
    const fahrten = alleFahrten().filter(i => i.fahrt !== ignoriere);
    const v = verbrauch(fahrten);
    const kollision = fahrten.find(i =>
      start < new Date(i.ende.getTime() + PUFFER * 60000) && ende > new Date(i.start.getTime() - PUFFER * 60000));
    const wochen = proWoche(start, ende).map(t => {
      const genutzt = v.woche[t.key] || 0;
      return { key: t.key, genutzt, neu: t.minuten, rest: Math.max(0, LIMIT - genutzt), danach: LIMIT - genutzt - t.minuten };
    });
    const voll = wochen.find(w => w.genutzt >= LIMIT);
    const zuViel = wochen.find(w => w.danach < 0);
    const gesperrt = proTag(start, ende).map(t => t.key).find(iso => (T.gesperrt || []).includes(iso));
    let grund = null;
    if (gesperrt) grund = "gesperrt";
    else if (voll) grund = "woche-voll";
    else if (kollision) grund = "belegt";
    else if (zuViel) grund = "limit";
    return { ok: !grund, grund, ende, kollision, wochen };
  }

  return {
    LIMIT, PUFFER, T, zwei, isoLokal, zeitText, zuDatum, minuten, wochenStart, wochenSchluessel, kw,
    dauerText, intervall, alleFahrten, verbrauch, wocheInfo, pruefe, proTag, proWoche,
  };
})();
