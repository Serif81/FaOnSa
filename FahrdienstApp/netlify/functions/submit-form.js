// netlify/functions/submit-form.js

exports.handler = async (event) => {
    try {
        // Hier wird angenommen, dass die Daten als 'application/x-www-form-urlencoded' gesendet werden
        const data = new URLSearchParams(event.body); // Daten aus dem Formular empfangen

        // Hol die Werte der Formulardaten
        const vorname = data.get('vorname');
        const nachname = data.get('nachname');
        const telefonnummer = data.get('telefonnummer');
        const email = data.get('email');

        // Hier kannst du die Logik für die Verarbeitung der Daten hinzufügen
        console.log({ vorname, nachname, telefonnummer, email }); // Debugging: gib die empfangenen Daten in der Konsole aus

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Anfrage erfolgreich!' }),
        };
    } catch (error) {
        console.error(error); // Logge den Fehler für Debugging
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Ein Fehler ist aufgetreten.' }),
        };
    }
};
