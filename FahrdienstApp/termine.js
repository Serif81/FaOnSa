/* =====================================================================
   TERMINE & VERFÜGBARKEIT – nur diese Datei pflegen
   ---------------------------------------------------------------------
   Datumsformat immer "JJJJ-MM-TT", Uhrzeiten "HH:MM" (24-Stunden-Format).

   Grundregeln (werden automatisch geprüft, siehe kalender.js):
   • Rund um die Uhr buchbar – 00:00 bis 23:59, jeden Tag, auch Nachtfahrten.
   • Maximal "wochenlimitStunden" Arbeitszeit pro Kalenderwoche (Mo 00:00 – So 24:00).
     Ist das Limit erreicht, ist die restliche Woche für neue Buchungen komplett gesperrt.
   • Jede eingetragene Fahrt sperrt ihr Zeitfenster gegen Überschneidungen und
     wird automatisch vom Wochenkontingent abgezogen.

   betriebsstart       Erster Tag, an dem gefahren wird.
   wochenlimitStunden  Maximale Arbeitszeit je Kalenderwoche.
   pufferMinuten       Optionaler Abstand vor/nach jeder Fahrt (0 = direkt anschließend buchbar).
   taktMinuten         Abstand der wählbaren Abholzeiten im Formular (60 = volle Stunde, 30 = halbe Stunde).
   geplanteDauer       Geschätzte Dauer je Fahrtart in Minuten. Damit prüft das Formular,
                       ob eine Kundenanfrage noch ins Wochenkontingent und in den Kalender passt.
   vorlaufTage         Mindest-Vorlauf in Tagen je Fahrtart.
                       Köln → Frankfurt: 7 Tage (Rückkehrpflicht – die Rückfahrt muss
                       vor Antritt der Hinfahrt nach Köln gebucht sein).
   gesperrt            Einzelne Tage komplett sperren (z. B. Urlaub, Krankheit).

   fahrten             BESTÄTIGTE Fahrten – hier nach jeder Bestätigung eine Zeile eintragen
                       (die Verwaltungsseite verwaltung.html erzeugt die Zeile fertig zum Kopieren).
                         datum   Starttag der Fahrt
                         von     Startzeit (Beginn der Arbeitszeit, z. B. Abfahrt/Abholung)
                         bis     Endzeit. Liegt "bis" vor/auf "von", geht die Fahrt über Mitternacht.
                         dauer   Alternativ zu "bis": Dauer als "H:MM" (z. B. "2:00").
                         strecke Kurzbeschreibung, z. B. "Frankfurt → Köln"
                       Die Arbeitszeit = von bis bis. Soll die Rückfahrt mitzählen, "bis" entsprechend setzen.

   ACHTUNG: Diese Datei ist öffentlich abrufbar – KEINE Kundennamen, Adressen
   oder Telefonnummern eintragen. Nur Datum, Uhrzeit und Strecke.
   ===================================================================== */
const TERMINE = {
  betriebsstart: "2026-11-14",

  wochenlimitStunden: 8,
  pufferMinuten: 0,
  taktMinuten: 60,

  geplanteDauer: {
    "Zum Flughafen": 60,
    "Vom Flughafen": 60,
    "Frankfurt → Köln": 120,
    "Köln → Frankfurt": 120,
    "Sonderfahrt": 60,
  },

  vorlaufTage: {
    "Köln → Frankfurt": 7,
  },

  gesperrt: [
    // "2026-12-26",
  ],

  fahrten: [
    // { datum: "2026-11-20", von: "18:00", bis: "20:00", strecke: "Frankfurt → Köln" },
    // { datum: "2026-11-21", von: "23:30", bis: "00:45", strecke: "Vom Flughafen (T3)" },  // über Mitternacht
    // { datum: "2026-11-22", von: "10:00", dauer: "1:15", strecke: "Zum Flughafen (T1)" },
  ],
};
