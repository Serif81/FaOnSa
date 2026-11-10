/* =====================================================================
   TERMINE & VERFÜGBARKEIT – nur diese Datei pflegen
   ---------------------------------------------------------------------
   Datumsformat immer "JJJJ-MM-TT", Uhrzeiten "HH:MM".

   betriebsstart  Erster Tag, an dem gefahren wird. Buchungen sind ab sofort
                  möglich, aber nur für Fahrten ab diesem Tag.

   wochentage     Wann welche Fahrt möglich ist (0 = Sonntag … 6 = Samstag).
                  Nicht aufgeführte Tage (Mo–Do) sind komplett gesperrt.
                    fahrten: Liste der buchbaren Fahrtarten oder "alle"
                    von/bis: erste und letzte wählbare Abholzeit
                    anfrage: true = Fahrt nur "auf Anfrage" (Bestätigung folgt)

   vorlaufTage    Mindest-Vorlauf in Tagen je Fahrtart.
                  Köln → Frankfurt: 7 Tage (Rückkehrpflicht – die Rückfahrt muss
                  vor Antritt der Hinfahrt nach Köln gebucht sein).

   gesperrt       Einzelne Tage komplett sperren (z. B. Urlaub, Krankheit).
   belegt         Bereits vergebene Abholzeiten je Tag – werden ausgegraut.
   ===================================================================== */
const TERMINE = {
  betriebsstart: "2026-11-14",

  wochentage: {
    0: { fahrten: ["Frankfurt → Köln"], von: "08:00", bis: "22:00" },               // Sonntag
    5: { fahrten: ["Köln → Frankfurt"], von: "13:00", bis: "16:00" },               // Freitag
    6: { fahrten: "alle",               von: "08:00", bis: "22:00", anfrage: true }, // Samstag
  },

  vorlaufTage: {
    "Köln → Frankfurt": 7,
  },

  gesperrt: [
    // "2026-12-26",
  ],

  belegt: {
    // "2026-11-15": ["09:00", "10:00"],
  },
};
