exports.handler = async (event) => {
    try {
        const data = JSON.parse(event.body); // Daten aus dem Formular empfangen

        // Hier kannst du die Logik für die Verarbeitung der Daten hinzufügen
        console.log(data); // Debugging: gib die empfangenen Daten in der Konsole aus

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
