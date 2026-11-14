/* =====================================================================
   FaOnSa Airport Transfers – Buchungsanfrage
   ---------------------------------------------------------------------
   Termine (Startdatum, Wochenlimit, Vorlauf, Sperrtage, bestätigte Fahrten) werden in
   termine.js gepflegt, die Rechenlogik steckt in kalender.js – hier nur allgemeine Einstellungen.
   ===================================================================== */
const EINSTELLUNGEN = {
  // Richtpreise für die Übersicht
  richtpreise: {
    "Zum Flughafen": "ab 59 € (Festpreis je nach Strecke, wird in der Bestätigung genannt)",
    "Vom Flughafen": "ab 59 € (Festpreis je nach Strecke, wird in der Bestätigung genannt)",
    "Frankfurt → Köln": "339 € je Strecke",
    "Köln → Frankfurt": "339 € je Strecke",
    "Sonderfahrt": "Preis auf Anfrage"
  }
};

/* ===================================================================== */

const T = KALENDER.T;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const zwei = KALENDER.zwei;
const isoLokal = KALENDER.isoLokal;
const FLUGHAFEN = "Flughafen Frankfurt am Main (FRA)";

function datumDE(iso) {
  if (!iso) return "";
  const [j, m, t] = iso.split("-");
  return `${t}.${m}.${j}`;
}
function datumLang(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}

document.addEventListener("DOMContentLoaded", () => {
  const form = $("#anfrageForm");
  const heute = isoLokal(new Date());
  const m = new Date(); m.setDate(m.getDate() + 1);
  const morgen = isoLokal(m);

  /* ---------- Startbalken: ab dem Starttag "Wir sind gestartet" ---------- */
  const startBalken = $("#startBalken");
  if (startBalken && T.betriebsstart && heute >= T.betriebsstart) {
    startBalken.innerHTML = `<strong>Wir sind gestartet!</strong> <span>Der FaOnSa Fahrdienst fährt seit dem ` +
      `${datumDE(T.betriebsstart)} – Fahrten ab sofort buchbar.</span>`;
  }

  /* ---------- Eröffnungsaktion nach Ablauf automatisch ausblenden ---------- */
  const aktion = $("#aktion");
  if (aktion && aktion.dataset.ende && heute > aktion.dataset.ende) aktion.hidden = true;

  /* ---------- Betriebsstart: Buchungen ab sofort, Fahrten ab Starttag ---------- */
  const gestartet = Boolean(T.betriebsstart);
  if (gestartet) {
    const status = $(".status");
    if (status) status.hidden = true;
    $("#anfrageTitel").textContent = "Fahrt anfragen";
    $("#anfrage .intro-text").textContent = "Wählen Sie Ihre Fahrt und einen verfügbaren Termin. Sie erhalten Ihre " +
      "Buchungsbestätigung mit Festpreis und Rechnung per E-Mail – bezahlt wird vorab per PayPal oder Überweisung.";
    $$('a[href="#anfrage"]:not(.aktion-btn)').forEach(a => (a.textContent = "Fahrt anfragen"));
  }
  const frueheste = (T.betriebsstart && T.betriebsstart > heute) ? T.betriebsstart : heute;
  const NICHT_VERFUEGBAR = "Die Fahrt ist zu diesem Termin nicht verfügbar.";
  const WOCHE_VOLL = "In dieser Kalenderwoche sind leider alle Fahrzeiten vergeben. Bitte wählen Sie einen Termin in einer anderen Woche.";

  /* ---------- Fahrtart: passende Felder einblenden ---------- */
  const gruppen = { flughafen: $('[data-fuer="flughafen"]'), sonderfahrt: $('[data-fuer="sonderfahrt"]'), koeln: $('[data-fuer="koeln"]') };
  function fahrtart() { return $('input[name="fahrtart"]:checked').value; }
  function gruppeFuer(art) {
    if (art.includes("Flughafen")) return "flughafen";
    if (art === "Sonderfahrt") return "sonderfahrt";
    return "koeln";
  }

  /* ---------- Verfügbarkeit: 24/7, Wochenlimit & Überschneidungen (Logik in kalender.js) ---------- */
  const K = KALENDER;
  const plusTage = n => { const d = new Date(); d.setDate(d.getDate() + n); return isoLokal(d); };
  function fruehestesDatum(art) {
    return frueheste;
  }
  const geplanteDauer = art => (T.geplanteDauer || {})[art] || 60;
  // Rund um die Uhr: alle Abholzeiten von 00:00 bis 23:xx im eingestellten Takt
  const ABHOLZEITEN = (() => {
    const takt = Math.max(5, T.taktMinuten || 60), z = [];
    for (let m = 0; m < 1440; m += takt) z.push(`${zwei(Math.floor(m / 60))}:${zwei(m % 60)}`);
    return z;
  })();
  // Wochentags-Regel (termine.js → wochentage): welche Fahrt an welchem Tag, welche Uhrzeiten
  function erlaubtAm(wochentag, art) {
    const r = (T.wochentage || {})[wochentag];
    return r && (r.fahrten === "alle" || r.fahrten.includes(art)) ? r : null;
  }
  const regelFuer = (iso, art) => iso ? erlaubtAm(K.zuDatum(iso).getDay(), art) : null;

  // Prüft, ob am Sonntag davor (5 Tage vor Freitag) eine bestätigte Fahrt "Frankfurt → Köln" eingetragen ist
  function hatHinfahrtAmSonntagDavor(freitagIso) {
    const so = K.zuDatum(freitagIso);
    so.setDate(so.getDate() - 5);
    const sonntagIso = isoLokal(so);
    return (T.fahrten || []).some(f => f && f.datum === sonntagIso && f.strecke && f.strecke.includes("Frankfurt → Köln"));
  }

  // Grund (Text), warum ein Datum nicht buchbar ist – oder null
  function datumGesperrt(iso, art) {
    if (!iso || iso < frueheste || (T.gesperrt || []).includes(iso) || !regelFuer(iso, art)) return NICHT_VERFUEGBAR;
    const wochentag = K.zuDatum(iso).getDay();
    // Spezielle Freitags-Regel für Köln → Frankfurt (gilt NICHT samstags!)
    if (art === "Köln → Frankfurt" && wochentag === 5) {
      const vorlauf = (T.vorlaufTage || {})[art] || 0;
      if (vorlauf > 0 && iso < plusTage(vorlauf)) {
        return `Köln → Frankfurt ist freitags nur mit mindestens ${vorlauf} Tagen Vorlauf buchbar.`;
      }
      if (T.rueckkehrpflichtKoelnFfm && !hatHinfahrtAmSonntagDavor(iso)) {
        return "An diesem Freitag ist keine Fahrt Köln → Frankfurt verfügbar (keine Hinfahrt am Sonntag davor gebucht).";
      }
    }
    if (K.wocheInfo(K.zuDatum(iso)).voll) return WOCHE_VOLL;
    return null;
  }

  function zeitenAm(iso, art) {
    const r = regelFuer(iso, art);
    if (!r) return [];
    let zeiten = ABHOLZEITEN.filter(z => z >= r.von && z <= r.bis);
    // Wenn heute gewählt wird: bereits vergangene Uhrzeiten ausblenden
    if (iso === heute) {
      const jetzt = K.zeitText(new Date());
      zeiten = zeiten.filter(z => z > jetzt);
    }
    return zeiten;
  }
  const zeitFrei = (iso, z, art) => zeitenAm(iso, art).includes(z) && K.pruefe(K.zuDatum(iso, z), geplanteDauer(art)).ok;
  function freieZeiten(iso, art) {
    return datumGesperrt(iso, art) ? [] : zeitenAm(iso, art).filter(z => zeitFrei(iso, z, art));
  }
  const TAGNAME = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  function verfuegbarText(art) {
    const tage = [1, 2, 3, 4, 5, 6, 0].filter(t => erlaubtAm(t, art))
      .map(t => { const r = erlaubtAm(t, art); return `${TAGNAME[t]} ${r.von}–${r.bis} Uhr`; });
    return tage.length ? `Verfügbar: ${tage.join(" · ")}` : NICHT_VERFUEGBAR;
  }

  const terminWahl = $("#terminWahl"), datumFrei = $("#wunschdatumFrei"), datumFeld = $("#wunschdatum");
  const zeit = $("#wunschzeit"), hinweis = $("#terminHinweis");
  terminWahl.hidden = true;

  function baueTermine() {
    const art = fahrtart();
    datumFrei.min = fruehestesDatum(art);
    $("#terminLabel").setAttribute("for", "wunschdatumFrei");
    $("#terminLabel").textContent = "Termin *";
    uebernehmeDatum();
  }

  function uebernehmeDatum() {
    const art = fahrtart();
    datumFeld.value = datumFrei.value;
    const sperre = datumFeld.value ? datumGesperrt(datumFeld.value, art) : null;
    if (sperre) {
      hinweis.textContent = sperre;
      hinweis.classList.add("gesperrt");
    } else if (datumFeld.value && !freieZeiten(datumFeld.value, art).length) {
      hinweis.textContent = "An diesem Tag ist leider keine passende Abholzeit mehr frei.";
      hinweis.classList.add("gesperrt");
    } else {
      const vorlauf = (T.vorlaufTage || {})[art];
      hinweis.textContent = verfuegbarText(art) + "." +
        (art === "Köln → Frankfurt" && vorlauf ? ` (Freitags mind. ${vorlauf} Tage Vorlauf)` : "");
      hinweis.classList.remove("gesperrt");
    }
    baueZeiten();
    setzeAnfrageart();
  }

  function baueZeiten() {
    const gewaehlt = zeit.value, iso = datumFeld.value, art = fahrtart();
    const optionen = iso && !datumGesperrt(iso, art) ? zeitenAm(iso, art).map(z => ({ z, ok: zeitFrei(iso, z, art) })) : [];
    const frei = optionen.filter(o => o.ok);
    zeit.replaceChildren(new Option(iso && !frei.length ? "nicht verfügbar" : "Bitte wählen", ""));
    optionen.forEach(({ z, ok }) => {
      const o = new Option(ok ? `${z} Uhr` : `${z} Uhr (belegt)`, z);
      o.disabled = !ok;
      zeit.add(o);
    });
    zeit.disabled = !frei.length;
    if (gewaehlt && frei.some(o => o.z === gewaehlt)) zeit.value = gewaehlt;
  }

  function setzeAnfrageart() {
    const art = fahrtart(), r = regelFuer(datumFeld.value, art);
    const aufAnfrage = gruppeFuer(art) === "sonderfahrt" || Boolean(r && r.anfrage);
    form.elements["anfrageart"].value = aufAnfrage ? "Anfrage (auf Anfrage – Bestätigung folgt)" : "Buchungsanfrage";
    form.elements["termin_status"].value = aufAnfrage ? "auf Anfrage" : "verfügbarer Termin";
    $("#senden").textContent = "Anfrage verbindlich senden";
    $("#hinweisSchritt3").innerHTML =
      "Mit dem Absenden fragen Sie den gewählten Termin an. Der Vertrag kommt erst mit meiner Bestätigung per E-Mail zustande; " +
      "bezahlt wird vorab per PayPal oder Überweisung.";
  }

  function zeigeFahrtFelder() {
    const aktiv = gruppeFuer(fahrtart());
    Object.entries(gruppen).forEach(([name, el]) => {
      el.hidden = name !== aktiv;
      $$("select, input", el).forEach(f => {   // nur sichtbare Felder sind Pflicht
        if (["ort", "terminal", "vonOrt", "nachOrt"].includes(f.id)) f.required = name === aktiv;
      });
    });
    $("#ortLabel").textContent = fahrtart() === "Vom Flughafen" ? "Zieladresse (Straße, PLZ, Ort) *" : "Abholadresse (Straße, PLZ, Ort) *";
    baueTermine();
  }
  $$('input[name="fahrtart"]').forEach(r => r.addEventListener("change", zeigeFahrtFelder));
  datumFrei.addEventListener("change", uebernehmeDatum);
  zeigeFahrtFelder();

  /* ---------- Abweichende Abholadresse ---------- */
  const abholFelder = $("#abholFelder");
  function zeigeAbhol() {
    const anders = $('input[name="adresse_gleich"]:checked').value === "nein";
    abholFelder.hidden = !anders;
    $$("input", abholFelder).forEach(f => (f.required = anders));
  }
  $$('input[name="adresse_gleich"]').forEach(r => r.addEventListener("change", zeigeAbhol));
  zeigeAbhol();

  /* ---------- Schritte ---------- */
  function schrittGueltig(nr) {
    const feldset = $(`fieldset.schritt[data-schritt="${nr}"]`);
    const fehler = $(".fehler", feldset);
    const melde = (text, feld) => { fehler.textContent = text; fehler.hidden = false; feld?.focus(); return false; };
    const felder = $$("input, select, textarea", feldset).filter(f => f.required && !f.closest("[hidden]") && !f.hidden);
    const falsch = felder.find(f => !f.checkValidity());
    if (falsch) {
      const name = feldset.querySelector(`label[for="${falsch.id}"]`)?.textContent.replace("*", "").trim();
      return melde(falsch.type === "checkbox" ? "Bitte bestätigen Sie die markierte Angabe."
                                              : `Bitte prüfen Sie das Feld „${name || "Pflichtfeld"}“.`, falsch);
    }
    if (nr === 1) {
      if (!datumFeld.value) return melde("Bitte wählen Sie einen Termin.", datumFrei);
      const sperre = datumGesperrt(datumFeld.value, fahrtart());
      if (sperre) return melde(sperre, datumFrei);
      if (!zeit.value) return melde("Bitte wählen Sie eine Abholzeit.", zeit);
      if (!zeitFrei(datumFeld.value, zeit.value, fahrtart())) return melde("Diese Abholzeit ist leider nicht mehr frei.", zeit);
    }
    fehler.hidden = true;
    return true;
  }

  function zeigeSchritt(nr) {
    $$("fieldset.schritt").forEach(f => (f.hidden = f.dataset.schritt !== String(nr)));
    $$(".fortschritt li").forEach(li => {
      li.classList.toggle("aktiv", li.dataset.schritt === String(nr));
      li.classList.toggle("erledigt", Number(li.dataset.schritt) < nr);
    });
    if (nr === 3) baueZusammenfassung();
    $("#anfrage").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  $$("[data-weiter]").forEach(b => b.addEventListener("click", () => {
    const aktuell = Number(b.closest("fieldset").dataset.schritt);
    if (schrittGueltig(aktuell)) zeigeSchritt(Number(b.dataset.weiter));
  }));
  $$("[data-zurueck]").forEach(b => b.addEventListener("click", () => zeigeSchritt(Number(b.dataset.zurueck))));

  // Fehlerhinweis ausblenden, sobald der Kunde etwas korrigiert
  ["input", "change"].forEach(ev => form.addEventListener(ev, e => {
    const fehler = e.target.closest("fieldset.schritt")?.querySelector(".fehler");
    if (fehler) fehler.hidden = true;
  }));

  /* ---------- Zusammenfassung (Anzeige + E-Mail-Text) ---------- */
  function baueZusammenfassung() {
    const d = new FormData(form);
    const art = d.get("fahrtart");
    let strecke = "";
    const fra = `${FLUGHAFEN} – ${d.get("terminal")}`;
    if (art === "Zum Flughafen") strecke = `${d.get("ort")} → ${fra}`;
    else if (art === "Vom Flughafen") strecke = `${fra} → ${d.get("ort")}`;
    else if (art === "Sonderfahrt") strecke = `${d.get("von_ort")} → ${d.get("nach_ort")}`;
    else strecke = art;

    const adresse = d.get("adresse_gleich") === "nein"
      ? `${d.get("abhol_strasse")}, ${d.get("abhol_plz")} ${d.get("abhol_ort")}`
      : "wie Rechnungsanschrift";
    const termin = `${datumLang(d.get("wunschdatum"))}, ${d.get("wunschzeit")} Uhr`;
    const name = `${d.get("vorname")} ${d.get("nachname")}`;

    const zeilen = [
      ["Art der Anfrage", d.get("anfrageart")],
      ["Fahrt", art],
      ["Strecke", strecke],
      ["Termin", `${termin} (${d.get("termin_status")})`],
      ["Personen", d.get("personen")],
      ["Flugnummer", d.get("flugnummer")],
      ["Zusätzliches Gepäck", d.get("gepaeck")],
      ["Name", name],
      ["Kontakt", `${d.get("email")} · ${d.get("telefon")}`],
      ["Rechnungsanschrift", `${d.get("rechnung_strasse")}, ${d.get("rechnung_plz")} ${d.get("rechnung_ort")}`],
      ["Abhol-/Zieladresse", adresse],
      ["Bemerkung", d.get("bemerkung")]
    ].filter(([, v]) => v && String(v).trim());

    const dl = $("#zusammenfassung");
    dl.replaceChildren();
    zeilen.forEach(([k, v]) => {      // textContent statt innerHTML: Eingaben werden nie als HTML ausgeführt
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      dl.append(dt, dd);
    });
    const preis = EINSTELLUNGEN.richtpreise[art] || "auf Anfrage";
    $("#richtpreis").textContent = `Richtpreis: ${preis}`;

    // Für die E-Mail an den Betreiber: sprechender Betreff + lesbare Zusammenfassung
    const kurz = d.get("anfrageart").split(" (")[0];
    form.elements["subject"].value = `${kurz}: ${art} · ${datumDE(d.get("wunschdatum"))} ${d.get("wunschzeit")} · ${name}`;
    form.elements["zusammenfassung"].value = zeilen.map(([k, v]) => `${k}: ${v}`).concat([`Richtpreis: ${preis}`]).join("\n");
    // Maschinenlesbare Kopie für verwaltung.html („Anfrage einfügen“ → Bestätigung erstellen)
    const daten = {};
    ["fahrtart", "ort", "terminal", "flugnummer", "von_ort", "nach_ort", "wunschdatum", "wunschzeit", "personen", "gepaeck",
     "vorname", "nachname", "email", "telefon", "rechnung_strasse", "rechnung_plz", "rechnung_ort", "adresse_gleich",
     "abhol_strasse", "abhol_plz", "abhol_ort", "bemerkung"].forEach(k => { const v = d.get(k); if (v) daten[k] = v; });
    form.elements["buchungsdaten"].value = "FAONSA-DATEN " + JSON.stringify(daten);
  }

  /* ---------- Absenden (Netlify Forms -> E-Mail-Benachrichtigung) ---------- */
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!schrittGueltig(1)) { zeigeSchritt(1); return; }
    if (!schrittGueltig(2)) { zeigeSchritt(2); return; }
    if (!schrittGueltig(3)) return;
    baueZusammenfassung();
    const knopf = $("#senden");
    const text = knopf.textContent;
    const fehler = $('fieldset[data-schritt="3"] .fehler');
    knopf.disabled = true;
    knopf.textContent = "Wird gesendet …";
    try {
      const antwort = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString()
      });
      if (!antwort.ok) throw new Error(`Status ${antwort.status}`);
      const buchung = true;
      form.hidden = true;
      $(".fortschritt").hidden = true;
      $("#dankeTitel").textContent = buchung ? "Vielen Dank für Ihre Anfrage!" : "Vielen Dank für Ihre Voranfrage!";
      $("#dankeText").textContent = buchung
        ? "Ihre Anfrage ist bei mir eingegangen. Ich prüfe den Termin und sende Ihnen die Bestätigung mit Rechnung per E-Mail."
        : "Ihre Anfrage ist bei mir eingegangen. Ich prüfe sie und melde mich per E-Mail bei Ihnen. Bis dahin ist nichts weiter zu tun.";
      const danke = $("#danke");
      danke.hidden = false;
      danke.focus();
    } catch (err) {
      fehler.textContent = "Ihre Anfrage konnte gerade nicht gesendet werden. Bitte versuchen Sie es später erneut " +
                           "oder schreiben Sie an serif.u@faonsa.de.";
      fehler.hidden = false;
      knopf.disabled = false;
      knopf.textContent = text;
    }
  });

  /* ---------- Dialoge (Impressum, Datenschutz, AGB) ---------- */
  $$("[data-modal]").forEach(b => b.addEventListener("click", () => $("#" + b.dataset.modal).showModal()));
  $$("dialog.modal").forEach(dlg => {
    $(".close", dlg).addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });   // Klick auf Hintergrund
  });
});
