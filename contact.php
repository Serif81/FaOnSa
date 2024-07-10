<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = $_POST['name'];
    $email = $_POST['email'];
    $message = $_POST['message'];

    // Hier kannst du den Code für die Verarbeitung der Formulardaten einfügen, z.B. Senden einer E-Mail oder Speichern in einer Datenbank

    // Beispiel: Sende eine E-Mail mit den Formulardaten
    $to = "serif.u@faonsa.de";
    $subject = "Neue Kontaktanfrage";
    $body = "Name: $name\n";
    $body .= "E-Mail: $email\n";
    $body .= "Nachricht:\n$message";

    if (mail($to, $subject, $body)) {
        echo "Vielen Dank für Ihre Nachricht. Wir werden uns bald bei Ihnen melden.";
    } else {
        echo "Es gab ein Problem beim Senden Ihrer Nachricht. Bitte versuchen Sie es später erneut.";
    }
}
?>
