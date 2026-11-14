/* =====================================================================
   FaOnSa – Verwaltung: Wochenkonto & Buchungsbestätigung
   ---------------------------------------------------------------------
   Stammdaten für die E-Mail – bei Bedarf hier anpassen.
   WICHTIG: Diese Datei ist öffentlich abrufbar. Bankdaten (IBAN, BIC, Bank)
   werden hier bewusst NICHT gespeichert – die E-Mail enthält stattdessen den
   Platzhalter BANK_PLATZHALTER, den du in der fertigen E-Mail per Hand ersetzt.
   ===================================================================== */
const BANK_PLATZHALTER = "[BANKDATEN HIER EINTRAGEN]";

const ANBIETER = {
  firma: "FaOnSa – Airport Transfers",
  inhaber: "Serif Ünal",
  strasse: "Alzeyer Str. 1",
  ort: "65934 Frankfurt am Main",
  telefon: "01577 / 8724503",
  email: "serif.u@faonsa.de",
  web: "https://airport-transfers.faonsa.de",
  logo: "https://airport-transfers.faonsa.de/faonsa_Logo_3.png",
  kleinunternehmer: true,   // Hinweis § 19 UStG
};

// Offizielle Flughafenangabe – erscheint prominent in jeder Bestätigung mit Flughafenbezug
const FRA = {
  name: "Flughafen Frankfurt am Main (FRA)",
  adresse: "60547 Frankfurt am Main",
  hahnWarnung: "Bitte beachten: Dies ist NICHT der Flughafen Frankfurt-Hahn (HHN) im Hunsrück, " +
               "der rund 120 km entfernt liegt. Ihre Fahrt geht ausschließlich zum bzw. ab dem Flughafen Frankfurt am Main (FRA).",
};

/* ===================================================================== */
const K = KALENDER;
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const zwei = K.zwei;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const euro = n => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
const datumDE = d => d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
const datumLang = d => d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
const tagKurz = d => d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
const istFlughafen = art => art.includes("Flughafen");

/* ===================== Wochenkonto ===================== */
function zeigeWochenkonto() {
  const fahrten = K.alleFahrten();
  const v = K.verbrauch(fahrten);
  $("#limitText").textContent = `· Limit ${K.dauerText(K.LIMIT)} pro Kalenderwoche (Mo–So) · ${fahrten.length} bestätigte Fahrt(en)`;

  // Warnungen: Überschneidungen und Limit-Überschreitungen in termine.js
  const warn = [];
  fahrten.forEach((a, i) => fahrten.slice(i + 1).forEach(b => {
    if (a.start < b.ende && b.start < a.ende)
      warn.push(`Überschneidung in termine.js: ${tagKurz(a.start)} ${K.zeitText(a.start)}–${K.zeitText(a.ende)} ` +
                `und ${tagKurz(b.start)} ${K.zeitText(b.start)}–${K.zeitText(b.ende)}`);
  }));
  Object.entries(v.woche).forEach(([key, min]) => {
    if (min > K.LIMIT) warn.push(`Wochenlimit überschritten in KW ${K.kw(K.zuDatum(key)).kw}: ${K.dauerText(min)} eingetragen.`);
  });
  $("#warnungen").innerHTML = warn.map(w => `<p>⚠ ${esc(w)}</p>`).join("");

  // Wochen: aktuelle + 7 folgende, zusätzlich jede spätere Woche mit Fahrten
  const heute = K.wochenStart(new Date());
  const keys = new Set();
  for (let i = 0; i < 8; i++) { const d = new Date(heute); d.setDate(d.getDate() + 7 * i); keys.add(K.isoLokal(d)); }
  Object.keys(v.woche).filter(k => k >= K.isoLokal(heute)).forEach(k => keys.add(k));

  $("#wochen").innerHTML = [...keys].sort().map(key => {
    const mo = K.zuDatum(key), so = new Date(mo); so.setDate(so.getDate() + 6);
    const info = K.wocheInfo(mo, v);
    const prozent = Math.min(100, (info.genutzt / K.LIMIT) * 100);
    const tage = Object.entries(v.tag).filter(([iso]) => iso >= key && iso <= K.isoLokal(so)).sort();
    const liste = fahrten.filter(f => f.ende > mo && f.start < new Date(so.getTime() + 864e5));
    return `<article class="woche${info.voll ? " voll" : ""}${key === K.isoLokal(heute) ? " aktuell" : ""}">
      <h3>KW ${K.kw(mo).kw} / ${K.kw(mo).jahr}${info.voll ? '<span class="badge">ausgebucht – gesperrt</span>'
        : key === K.isoLokal(heute) ? '<span class="badge">aktuelle Woche</span>' : ""}</h3>
      <div class="zeitraum">${datumDE(mo)} – ${datumDE(so)}</div>
      <div class="balken"><span style="width:${prozent}%"></span></div>
      <div class="zahlen"><strong>${K.dauerText(info.genutzt)}</strong> verbraucht · <strong>${K.dauerText(info.rest)}</strong> frei</div>
      ${tage.length ? `<ul>${tage.map(([iso, m]) => `<li>${tagKurz(K.zuDatum(iso))}: ${K.dauerText(m)}</li>`).join("")}</ul>` : ""}
      ${liste.length ? `<ul>${liste.map(f => `<li>${tagKurz(f.start)} ${K.zeitText(f.start)}–${K.zeitText(f.ende)} · ${esc(f.fahrt.strecke || "")}</li>`).join("")}</ul>` : ""}
    </article>`;
  }).join("");
}

/* ===================== Import der Anfrage ===================== */
function importiere(text) {
  const m = text.match(/FAONSA-DATEN\s*(\{[\s\S]*?\})\s*(?:\n|$)/);
  let d = null;
  if (m) { try { d = JSON.parse(m[1]); } catch { d = null; } }
  if (!d) d = ausZusammenfassung(text);
  if (!d || !Object.keys(d).length) return false;

  const setze = (id, wert) => { if (wert !== undefined && wert !== null && wert !== "") $(id).value = wert; };
  setze("#b_vorname", d.vorname); setze("#b_nachname", d.nachname);
  setze("#b_email", d.email); setze("#b_telefon", d.telefon);
  setze("#b_fahrtart", d.fahrtart);
  if (/^Terminal [123]$/.test(d.terminal || "")) $("#b_terminal").value = d.terminal; else $("#b_terminal").value = "";
  setze("#b_flug", d.flugnummer); setze("#b_kundenadresse", d.ort);
  setze("#b_datum", d.wunschdatum); setze("#b_zeit", d.wunschzeit);
  setze("#b_personen", d.personen); setze("#b_gepaeck", d.gepaeck);

  const abhol = d.adresse_gleich === "nein" && d.abhol_strasse
    ? `${d.abhol_strasse}, ${d.abhol_plz || ""} ${d.abhol_ort || ""}`.trim()
    : [d.rechnung_strasse, `${d.rechnung_plz || ""} ${d.rechnung_ort || ""}`.trim()].filter(Boolean).join(", ");
  if (d.fahrtart === "Sonderfahrt") { setze("#b_von", d.von_ort); setze("#b_nach", d.nach_ort); }
  else if (d.fahrtart === "Frankfurt → Köln") { setze("#b_von", abhol); setze("#b_nach", "Köln (genaue Adresse bitte ergänzen)"); }
  else if (d.fahrtart === "Köln → Frankfurt") { setze("#b_von", "Köln (genaue Adresse bitte ergänzen)"); setze("#b_nach", abhol); }
  if (!$("#b_kundenadresse").value && abhol) $("#b_kundenadresse").value = abhol;

  const preise = { "Frankfurt → Köln": 339, "Köln → Frankfurt": 339 };
  if (!$("#b_preis").value && preise[d.fahrtart]) $("#b_preis").value = preise[d.fahrtart];
  if (d.bemerkung) $("#b_nachricht").placeholder = `Bemerkung des Kunden: ${d.bemerkung}`;
  $("#b_ende").value = "";
  $("#b_nr").value = "";
  return true;
}

// Fallback: lesbare Zusammenfassung „Feld: Wert“ aus älteren Anfragen
function ausZusammenfassung(text) {
  const z = {};
  text.split(/\r?\n/).forEach(l => { const i = l.indexOf(":"); if (i > 0) z[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
  const d = {};
  if (z["Fahrt"]) d.fahrtart = z["Fahrt"];
  if (z["Name"]) {
    const teile = z["Name"].split(/\s+/);
    d.vorname = teile.shift();
    d.nachname = teile.join(" ");
  }
  if (z["Kontakt"]) [d.email, d.telefon] = z["Kontakt"].split("·").map(s => s.trim());
  const t = (z["Termin"] || "").match(/(\d{2})\.(\d{2})\.(\d{4}),\s*(\d{2}:\d{2})/);
  if (t) { d.wunschdatum = `${t[3]}-${t[2]}-${t[1]}`; d.wunschzeit = t[4]; }
  const term = (z["Strecke"] || "").match(/Terminal [123]/);
  if (term) d.terminal = term[0];
  if (z["Personen"]) d.personen = z["Personen"];
  if (z["Flugnummer"]) d.flugnummer = z["Flugnummer"];
  if (z["Zusätzliches Gepäck"]) d.gepaeck = z["Zusätzliches Gepäck"];
  if (z["Bemerkung"]) d.bemerkung = z["Bemerkung"];
  if (z["Rechnungsanschrift"]) d.rechnung_strasse = z["Rechnungsanschrift"];
  return d;
}

/* ===================== Formular lesen & prüfen ===================== */
function lies() {
  const g = id => $(id).value.trim();
  const art = g("#b_fahrtart");
  const terminal = g("#b_terminal");
  const fraText = terminal ? `${FRA.name} – ${terminal}` : FRA.name;
  let von, nach;
  if (art === "Zum Flughafen") { von = g("#b_kundenadresse"); nach = fraText; }
  else if (art === "Vom Flughafen") { von = fraText; nach = g("#b_kundenadresse"); }
  else { von = g("#b_von"); nach = g("#b_nach"); }

  const start = g("#b_datum") && g("#b_zeit") ? K.zuDatum(g("#b_datum"), g("#b_zeit")) : null;
  let ende = null;
  if (start && g("#b_ende")) { ende = K.zuDatum(g("#b_datum"), g("#b_ende")); if (ende <= start) ende.setDate(ende.getDate() + 1); }
  const dauer = start && ende ? (ende - start) / 60000 : null;

  const preis = parseFloat(g("#b_preis").replace(",", ".")) || 0;
  const rabatt = Math.min(100, Math.max(0, parseFloat(g("#b_rabatt")) || 0));
  const abzug = Math.round(preis * rabatt) / 100;

  const nr = g("#b_nr") || (start ? `FS-${K.isoLokal(start).replace(/-/g, "")}-${K.zeitText(start).replace(":", "")}` : "");
  return {
    art, terminal, von, nach, start, ende, dauer, nr, preis, rabatt, abzug, gesamt: preis - abzug,
    anrede: g("#b_anrede"), vorname: g("#b_vorname"), nachname: g("#b_nachname"),
    email: g("#b_email"), telefon: g("#b_telefon"), flug: g("#b_flug"),
    personen: g("#b_personen"), gepaeck: g("#b_gepaeck"), rabattText: g("#b_rabattText"),
    frist: g("#b_frist"), nachricht: g("#b_nachricht"), bank: g("#b_bank"),
  };
}

function pruefe(b) {
  const fehler = [];
  if (!b.vorname && !b.nachname) fehler.push("Name des Kunden fehlt.");
  if (!b.email) fehler.push("E-Mail-Adresse des Kunden fehlt.");
  if (istFlughafen(b.art) && !b.terminal) fehler.push("Terminal (1, 2 oder 3) am Flughafen Frankfurt am Main muss gewählt sein.");
  if (!b.start) fehler.push("Datum und Abholzeit fehlen.");
  if (b.start && !b.ende) fehler.push("Arbeitsende fehlt – ohne Endzeit kann die Arbeitszeit nicht abgezogen werden.");
  if (!b.preis) fehler.push("Festpreis fehlt.");
  if (!b.start || !b.ende) return { ok: false, fehler, text: "" };

  // Bereits eingetragene identische Fahrt nicht gegen sich selbst prüfen
  const eigen = (K.T.fahrten || []).find(f => f.datum === K.isoLokal(b.start) && f.von === K.zeitText(b.start));
  const r = K.pruefe(b.start, b.dauer, { ignoriere: eigen });
  const w = r.wochen.map(x => `KW ${K.kw(K.zuDatum(x.key)).kw}: bisher ${K.dauerText(x.genutzt)} verbraucht, ` +
    `diese Fahrt ${K.dauerText(x.neu)}, danach ${x.danach >= 0 ? `${K.dauerText(x.danach)} frei` : `${K.dauerText(-x.danach)} ZU VIEL`}`);
  if (r.grund === "gesperrt") fehler.push("Der Tag ist in termine.js als gesperrt eingetragen.");
  if (r.grund === "woche-voll") fehler.push("Das Wochenlimit ist bereits erreicht – diese Woche ist komplett gesperrt.");
  if (r.grund === "belegt") fehler.push(`Überschneidung mit bestätigter Fahrt ${tagKurz(r.kollision.start)} ` +
    `${K.zeitText(r.kollision.start)}–${K.zeitText(r.kollision.ende)} (${r.kollision.fahrt.strecke || ""}).`);
  if (r.grund === "limit") fehler.push(`Die Fahrt (${K.dauerText(b.dauer)}) passt nicht mehr ins Wochenlimit.`);
  return { ok: !fehler.length, fehler, text: w.join(" · "), eigen };
}

/* ===================== E-Mail (HTML + Text) ===================== */
const FARBE = "#4c6b3b", FARBE_DUNKEL = "#3a4f2b", HELL = "#eef3ea";

function anredeText(b) {
  if (b.anrede === "Frau") return `Sehr geehrte Frau ${b.nachname}`;
  if (b.anrede === "Herr") return `Sehr geehrter Herr ${b.nachname}`;
  return `Guten Tag ${[b.vorname, b.nachname].filter(Boolean).join(" ")}`.trim();
}
function betreff(b) {
  return `Buchungsbestätigung ${b.nr} – ${b.art}${b.start ? ` am ${datumDE(b.start)}, ${K.zeitText(b.start)} Uhr` : ""}`;
}
function details(b) {
  return [
    ["Buchungsnummer", b.nr],
    ["Datum", b.start ? datumLang(b.start) : ""],
    ["Abholzeit", b.start ? `${K.zeitText(b.start)} Uhr` : ""],
    ["Fahrt", b.art],
    ["Abholung", b.von],
    ["Ziel", b.nach],
    ["Flugnummer", b.flug],
    ["Fahrgäste", b.personen],
    ["Sperriges Gepäck", b.gepaeck],
  ].filter(([, v]) => v);
}
function zahlung(b) {
  return [
    ["Verwendungszweck", b.nr],
    ["Zahlungsfrist", b.frist],
  ].filter(([, v]) => v);
}

function emailHtml(b) {
  const zeile = ([k, v], i) => `<tr><td style="padding:10px 14px;color:#6b6b6b;font-size:14px;width:38%;vertical-align:top;${i ? "border-top:1px solid #ececec;" : ""}">${esc(k)}</td>` +
    `<td style="padding:10px 14px;color:#222;font-size:15px;font-weight:600;vertical-align:top;${i ? "border-top:1px solid #ececec;" : ""}">${esc(v)}</td></tr>`;
  const flughafen = istFlughafen(b.art) ? `
    <tr><td style="padding:0 32px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid ${FARBE};border-radius:10px;background:${HELL};">
        <tr><td style="padding:18px 20px;">
          <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${FARBE_DUNKEL};font-weight:700;">&#9992; Ihr Flughafen</div>
          <div style="font-size:21px;line-height:1.3;font-weight:700;color:#1d2a15;margin-top:6px;">${esc(FRA.name)} – ${esc(b.terminal || "Terminal ?")}</div>
          <div style="font-size:14px;color:#3d3d3d;margin-top:2px;">${esc(FRA.adresse)}</div>
          <div style="margin-top:12px;padding:10px 12px;background:#fff7e0;border-left:4px solid #e0a800;font-size:13px;line-height:1.5;color:#5a4500;">
            <strong>Bitte beachten:</strong> ${esc(FRA.hahnWarnung.replace(/^Bitte beachten: /, ""))}
          </div>
        </td></tr>
      </table>
    </td></tr>` : "";
  const preisZeilen = [
    ["Festpreis", euro(b.preis)],
    ...(b.rabatt ? [[`${b.rabattText || "Rabatt"} (${b.rabatt} %)`, `– ${euro(b.abzug)}`]] : []),
  ];
  const zahl = zahlung(b);
  const nachricht = b.nachricht ? `
    <tr><td style="padding:0 32px 24px;">
      <div style="background:#f7f8f6;border-radius:8px;padding:14px 16px;font-size:15px;line-height:1.6;color:#333;">${esc(b.nachricht).replace(/\n/g, "<br>")}</div>
    </td></tr>` : "";

  return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(betreff(b))}</title></head>
<body style="margin:0;padding:0;background:#eef0ec;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">Ihre Fahrt am ${b.start ? esc(datumDE(b.start)) : ""} ist bestätigt – alle Details und Zahlungsinformationen.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0ec;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06);">

  <tr><td style="background:${FARBE};padding:22px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle;"><img src="${esc(ANBIETER.logo)}" alt="FaOnSa" height="44" style="display:block;height:44px;border:0;background:#fff;border-radius:6px;padding:4px;"></td>
      <td align="right" style="vertical-align:middle;color:#e6eedf;font-size:13px;line-height:1.4;">Airport Transfers<br>&amp; Fahrdienst Frankfurt</td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:30px 32px 8px;">
    <div style="display:inline-block;background:${HELL};color:${FARBE_DUNKEL};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:5px 12px;border-radius:99px;">&#10003; Buchung bestätigt</div>
    <h1 style="margin:14px 0 4px;font-size:24px;line-height:1.3;color:#1d2a15;">Ihre Fahrt ist verbindlich gebucht</h1>
    <div style="font-size:14px;color:#6b6b6b;">Buchungsnummer <strong style="color:#222;">${esc(b.nr)}</strong></div>
  </td></tr>

  <tr><td style="padding:16px 32px 24px;font-size:15px;line-height:1.65;color:#333;">
    ${esc(anredeText(b))},<br><br>
    vielen Dank für Ihre Buchung. Hiermit bestätige ich Ihre Fahrt zu den unten aufgeführten Konditionen.
    Bitte prüfen Sie alle Angaben – insbesondere Datum, Uhrzeit${istFlughafen(b.art) ? " und Terminal" : " und Adressen"} – und melden Sie sich umgehend, falls etwas nicht stimmt.
  </td></tr>

  ${flughafen}

  <tr><td style="padding:0 32px 8px;"><div style="font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${FARBE};">Ihre Fahrt</div></td></tr>
  <tr><td style="padding:0 32px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3e3e3;border-radius:10px;">${details(b).map(zeile).join("")}</table>
  </td></tr>

  <tr><td style="padding:0 32px 8px;"><div style="font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${FARBE};">Preis</div></td></tr>
  <tr><td style="padding:0 32px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3e3e3;border-radius:10px;">
      ${preisZeilen.map(zeile).join("")}
      <tr><td style="padding:14px;background:${FARBE};color:#fff;font-size:15px;font-weight:700;border-radius:0 0 0 9px;">Gesamtbetrag (Festpreis)</td>
          <td style="padding:14px;background:${FARBE};color:#fff;font-size:20px;font-weight:700;border-radius:0 0 9px 0;">${euro(b.gesamt)}</td></tr>
    </table>
    ${ANBIETER.kleinunternehmer ? '<div style="font-size:12px;color:#7a7a7a;margin-top:8px;">Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).</div>' : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border:1px solid #e3e3e3;border-radius:10px;background:#fafbf9;">
      <tr><td style="padding:14px 16px;">
        <div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${FARBE};margin-bottom:6px;">Bankverbindung für Ihre Überweisung</div>
        <div style="font-size:15px;line-height:1.6;color:#222;font-weight:600;">${esc(b.bank || BANK_PLATZHALTER).replace(/\n/g, "<br>")}</div>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:0 32px 8px;"><div style="font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${FARBE};">Zahlung – bargeldlos im Voraus</div></td></tr>
  <tr><td style="padding:0 32px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3e3e3;border-radius:10px;">${zahl.map(zeile).join("")}</table>
    <div style="font-size:13px;color:#555;margin-top:8px;line-height:1.5;">Bitte zahlen Sie per PayPal oder Banküberweisung. Im Fahrzeug ist keine Zahlung möglich – auch nicht in bar.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border:1px solid #c9d7ee;border-radius:10px;background:#f3f7fd;">
      <tr><td style="padding:12px 16px;font-size:14px;line-height:1.5;color:#1f3b63;">
        <strong>Zahlung per PayPal:</strong> Den PayPal-QR-Code finden Sie als Bild <strong>im Anhang dieser E-Mail</strong>.
        Einfach mit der PayPal-App scannen und den Gesamtbetrag mit Verwendungszweck ${esc(b.nr)} senden.
      </td></tr>
    </table>
  </td></tr>

  ${nachricht}

  <tr><td style="padding:0 32px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8f6;border-radius:10px;"><tr><td style="padding:16px 18px;font-size:13px;line-height:1.7;color:#444;">
      <strong style="color:#222;">Gut zu wissen</strong><br>
      &bull; Bitte seien Sie pünktlich am Abholort – ab 10 Minuten nach der vereinbarten Zeit gilt die Fahrt laut AGB als nicht angetreten.<br>
      ${b.art === "Vom Flughafen" ? "&bull; Bei Flugverspätung oder Verzögerung am Gepäckband informieren Sie mich bitte sofort telefonisch.<br>" : ""}
      &bull; Bis zu 3 Fahrgäste, Gepäck bis 40 kg pro Person inklusive.<br>
      &bull; Es gelten die AGB (Stand November 2026), die Sie bei der Anfrage akzeptiert haben.
    </td></tr></table>
  </td></tr>

  <tr><td style="padding:0 32px 30px;font-size:15px;line-height:1.6;color:#333;">
    Ich freue mich, Sie zu fahren.<br><br>Mit freundlichen Grüßen<br><strong>${esc(ANBIETER.inhaber)}</strong><br>${esc(ANBIETER.firma)}
  </td></tr>

  <tr><td style="background:#2f3b27;padding:20px 32px;color:#cfd8c8;font-size:12px;line-height:1.7;">
    <strong style="color:#fff;">${esc(ANBIETER.firma)}</strong> · Inhaber ${esc(ANBIETER.inhaber)}<br>
    ${esc(ANBIETER.strasse)} · ${esc(ANBIETER.ort)}<br>
    Telefon ${esc(ANBIETER.telefon)} · <a href="mailto:${esc(ANBIETER.email)}" style="color:#fff;">${esc(ANBIETER.email)}</a> ·
    <a href="${esc(ANBIETER.web)}" style="color:#fff;">${esc(ANBIETER.web.replace(/^https?:\/\//, ""))}</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function emailText(b) {
  const block = (titel, zeilen) => `${titel.toUpperCase()}\n${zeilen.map(([k, v]) => `  ${k}: ${v}`).join("\n")}\n`;
  const teile = [
    `${anredeText(b)},\n\nvielen Dank für Ihre Buchung. Hiermit bestätige ich Ihre Fahrt verbindlich (Buchungsnummer ${b.nr}).\n`,
  ];
  if (istFlughafen(b.art)) teile.push(
    `============================================================\n` +
    `FLUGHAFEN: ${FRA.name} – ${b.terminal || "Terminal ?"}\n${FRA.adresse}\n` +
    `${FRA.hahnWarnung}\n` +
    `============================================================\n`);
  teile.push(block("Ihre Fahrt", details(b)));
  teile.push(block("Preis", [["Festpreis", euro(b.preis)], ...(b.rabatt ? [[`${b.rabattText} (${b.rabatt} %)`, `– ${euro(b.abzug)}`]] : []),
    ["Gesamtbetrag", euro(b.gesamt)]]) + (ANBIETER.kleinunternehmer ? "  Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.\n" : "") +
    `\nBANKVERBINDUNG FÜR IHRE ÜBERWEISUNG\n  ${(b.bank || BANK_PLATZHALTER).replace(/\n/g, "\n  ")}\n`);
  teile.push(block("Zahlung – bargeldlos im Voraus", zahlung(b)) +
    `  Bitte per PayPal oder Banküberweisung zahlen – keine Barzahlung im Fahrzeug.\n` +
    `  PayPal: Den PayPal-QR-Code finden Sie als Bild im Anhang dieser E-Mail (Verwendungszweck ${b.nr}).\n`);
  if (b.nachricht) teile.push(b.nachricht + "\n");
  teile.push(`Bitte seien Sie pünktlich – ab 10 Minuten nach der vereinbarten Zeit gilt die Fahrt laut AGB als nicht angetreten.\n`);
  teile.push(`Mit freundlichen Grüßen\n${ANBIETER.inhaber}\n${ANBIETER.firma}\n${ANBIETER.strasse}, ${ANBIETER.ort}\n` +
             `Tel. ${ANBIETER.telefon} · ${ANBIETER.email} · ${ANBIETER.web}`);
  return teile.join("\n");
}

/* ===================== Zeile für termine.js ===================== */
function terminZeile(b) {
  if (!b.start || !b.ende) return "";
  const kurz = istFlughafen(b.art) ? `${b.art} (${(b.terminal || "T?").replace("Terminal ", "T")})` : b.art;
  return `{ datum: "${K.isoLokal(b.start)}", von: "${K.zeitText(b.start)}", bis: "${K.zeitText(b.ende)}", strecke: "${kurz}" },`;
}

/* ===================== Oberfläche ===================== */
let aktuell = null, freigabe = false;

function aktualisiere() {
  const art = $("#b_fahrtart").value;
  $$("[data-nur=flughafen]").forEach(el => (el.hidden = !istFlughafen(art)));
  $$("[data-nur=strecke]").forEach(el => (el.hidden = istFlughafen(art)));
  $("#b_kundenadresseLabel").textContent = art === "Vom Flughafen" ? "Zieladresse des Kunden" : "Abholadresse des Kunden";

  // Arbeitsende vorschlagen: Abholzeit + geplante Dauer der Fahrtart
  if ($("#b_datum").value && $("#b_zeit").value && !$("#b_ende").value) {
    const s = K.zuDatum($("#b_datum").value, $("#b_zeit").value);
    $("#b_ende").value = K.zeitText(new Date(s.getTime() + ((K.T.geplanteDauer || {})[art] || 60) * 60000));
  }

  const b = lies();
  aktuell = b;
  $("#b_dauer").value = b.dauer ? K.dauerText(b.dauer) : "";
  const p = pruefe(b);
  freigabe = p.ok;
  const box = $("#pruefung");
  box.className = "pruefung " + (p.ok ? "ok" : "fehler");
  box.innerHTML = p.ok
    ? `<strong>✔ Termin frei und im Wochenlimit.</strong><br>${esc(p.text)}` +
      (p.eigen ? "<br><em>Diese Fahrt steht bereits in termine.js.</em>" : "")
    : `<strong>✖ Noch nicht versandbereit:</strong><ul style="margin:6px 0 0;padding-left:18px">${p.fehler.map(f => `<li>${esc(f)}</li>`).join("")}</ul>` +
      (p.text ? `<div style="margin-top:6px">${esc(p.text)}</div>` : "");
  ["#kopieren", "#eml", "#mailto", "#zeileKopieren"].forEach(id => ($(id).disabled = !p.ok));
  $("#terminZeile").value = p.ok ? terminZeile(b) : "";
  $("#vorschau").srcdoc = emailHtml(b);
}

function melde(text) { $("#aktionMeldung").textContent = text; }

async function kopiereFormatiert() {
  const html = emailHtml(aktuell), text = emailText(aktuell);
  try {
    await navigator.clipboard.write([new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([text], { type: "text/plain" }),
    })]);
  } catch {
    // Fallback: Vorschau markieren und kopieren
    const doc = $("#vorschau").contentDocument;
    const r = doc.createRange(); r.selectNodeContents(doc.body);
    const sel = doc.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    doc.execCommand("copy"); sel.removeAllRanges();
  }
  melde(`Kopiert. Neue E-Mail an ${aktuell.email} öffnen, Betreff „${betreff(aktuell)}“ eintragen und mit Strg+V einfügen.` + vorDemSenden());
}

// Erinnerung: QR-Code anhängen, ggf. Bankdaten-Platzhalter ersetzen
function vorDemSenden() {
  return " Vor dem Senden: PayPal-QR-Code als Anhang hinzufügen" +
    (aktuell.bank ? "." : ` und ${BANK_PLATZHALTER} durch deine Bankdaten ersetzen.`);
}

function b64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = ""; bytes.forEach(x => (bin += String.fromCharCode(x)));
  return btoa(bin).replace(/.{76}/g, "$&\r\n");
}
function speichereEml() {
  const b = aktuell, grenze = "faonsa-" + Date.now();
  const eml = [
    `To: ${b.email}`,
    `From: ${ANBIETER.firma} <${ANBIETER.email}>`,
    `Subject: =?UTF-8?B?${b64(betreff(b)).replace(/\r\n/g, "")}?=`,
    "X-Unsent: 1",
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${grenze}"`,
    "",
    `--${grenze}`, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", b64(emailText(b)),
    `--${grenze}`, "Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64", "", b64(emailHtml(b)),
    `--${grenze}--`, "",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([eml], { type: "message/rfc822" }));
  a.download = `Buchungsbestaetigung_${b.nr}.eml`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  melde("E-Mail-Datei gespeichert – per Doppelklick öffnet sie sich in Outlook/Thunderbird als Entwurf." + vorDemSenden());
}

function oeffneMailto() {
  const b = aktuell;
  location.href = `mailto:${encodeURIComponent(b.email)}?subject=${encodeURIComponent(betreff(b))}&body=${encodeURIComponent(emailText(b))}`;
  melde("Mailprogramm geöffnet (nur Textfassung). Für die gestaltete Fassung „formatiert kopieren“ oder .eml verwenden." + vorDemSenden());
}

document.addEventListener("DOMContentLoaded", () => {
  zeigeWochenkonto();
  $("#best").addEventListener("input", aktualisiere);
  $("#best").addEventListener("change", aktualisiere);
  // Neue Startzeit/Fahrtart -> Endzeit neu vorschlagen
  ["#b_zeit", "#b_datum", "#b_fahrtart"].forEach(id => $(id).addEventListener("change", () => { $("#b_ende").value = ""; aktualisiere(); }));
  $("#uebernehmen").addEventListener("click", () => {
    const ok = importiere($("#import").value);
    $("#importMeldung").textContent = ok
      ? "Daten übernommen. Bitte Preis, Arbeitsende und ggf. Terminal prüfen."
      : "Keine Anfragedaten erkannt. Bitte den kompletten Text der Benachrichtigung einfügen.";
    aktualisiere();
  });
  $("#leeren").addEventListener("click", () => { $("#best").reset(); $("#import").value = ""; $("#b_nachricht").placeholder = ""; aktualisiere(); });
  $("#kopieren").addEventListener("click", () => freigabe && kopiereFormatiert());
  $("#eml").addEventListener("click", () => freigabe && speichereEml());
  $("#mailto").addEventListener("click", () => freigabe && oeffneMailto());
  $("#zeileKopieren").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("#terminZeile").value);
    melde("Zeile kopiert – in termine.js unter „fahrten: [“ einfügen und Seite neu veröffentlichen.");
  });
  aktualisiere();
});
