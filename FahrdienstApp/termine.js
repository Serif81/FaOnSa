/* =====================================================================
   TERMINE – nur diese Datei pflegen, um Fahrten freizuschalten
   ---------------------------------------------------------------------
   Datumsformat immer "JJJJ-MM-TT", z. B. "2027-03-06".

   betriebsstart  Ab diesem Tag sind freigeschaltete Termine verbindlich anfragbar
                  ("Buchungsanfrage"). null = noch kein Start -> alles läuft als Voranfrage.

   flughafen      Freigeschaltete Tage für "Zum / Vom Flughafen" (z. B. Ihre Samstage).
   koeln          Freigeschaltete Tage für "Köln → Frankfurt".
                  Leere Liste [] = für dieses Angebot ist nichts freigeschaltet:
                  Der Kunde kann dann nur eine unverbindliche Voranfrage mit Wunschtermin stellen.

   belegt         Bereits vergebene Abholzeiten je Tag – werden als "belegt" ausgegraut.

   Sonderfahrten haben immer einen frei wählbaren Wunschtermin (Anfrage, Sie prüfen).
   ===================================================================== */
const TERMINE = {
  betriebsstart: null,

  flughafen: [
    // "2027-03-06",
    // "2027-03-13",
  ],

  koeln: [
    // "2027-03-05",
  ],

  belegt: {
    // "2027-03-06": ["09:00", "10:00"],
  },
};
