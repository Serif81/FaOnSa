<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = $_POST['name'];
    $email = $_POST['email'];
    $message = $_POST['message'];

    // Empfänger-E-Mail-Adresse
    $empfaenger = 'serif.u@faonsa.de';

    // Betreff der E-Mail
    $betreff = 'Neue Kontaktanfrage von ' . $name;

    // E-Mail-Inhalt
    $nachricht = "Name: $name\n";
    $nachricht .= "E-Mail: $email\n";
    $nachricht .= "Nachricht:\n$message";

    // E-Mail senden
    if (mail($empfaenger, $betreff, $nachricht)) {
        echo 'Die E-Mail wurde erfolgreich versendet.';
    } else {
        echo 'Beim Versenden der E-Mail ist ein Fehler aufgetreten.';
    }
}
?>
