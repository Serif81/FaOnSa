document.addEventListener("DOMContentLoaded", function() {
    const contactSection = document.getElementById("contact");
    const summarySection = document.getElementById("summary");
    contactSection.style.display = "none";

    const confirmButtons = document.querySelectorAll(".confirm-button");
    confirmButtons.forEach(button => {
        button.addEventListener("click", function() {
            const form = button.closest("form");
            const timeSelect = form.querySelector("select");

            if (timeSelect.value !== "") {
                contactSection.style.display = "block";
                scrollToContactForm();
                checkRequiredFields(); // Überprüfen der Pflichtfelder beim Öffnen des Formulars
            }
        });
    });

    function scrollToContactForm() {
        contactSection.scrollIntoView({ behavior: "smooth" });
    }

    const contactForm = document.querySelector("#contact form");
    const showAGBButton = document.getElementById("showAGB");
    const confirmAGBButton = document.getElementById("confirmAGB");
    const nextStepButton = document.getElementById("nextStepButton");

    contactForm.addEventListener("input", checkRequiredFields);

    function checkRequiredFields() {
        const addressRadios = document.querySelectorAll('input[name="sameAddress"]');
        const pickupAddressField = document.getElementById("pickupAddressField");
        const isSameAddressSelected = Array.from(addressRadios).some(radio => radio.checked && radio.value === "ja");

        // Überprüfen der Pflichtfelder basierend auf der Auswahl "Ja" oder "Nein"
        const requiredFields = isSameAddressSelected 
            ? Array.from(contactForm.querySelectorAll("[required]:not(#pickupStreet, #pickupPostal, #pickupCity)"))
            : Array.from(contactForm.querySelectorAll("[required]"));

        const allFieldsFilled = requiredFields.every(input => input.value.trim() !== "");

        // AGB-Button nur aktivieren, wenn die Pflichtfelder ausgefüllt sind
        showAGBButton.disabled = !allFieldsFilled;

        // Nächster Schritt-Button immer deaktiviert, bis die AGB bestätigt sind
        nextStepButton.disabled = true; 
    }

    showAGBButton.addEventListener("click", function() {
        document.getElementById("agb").style.display = "block";
    });

    confirmAGBButton.addEventListener("click", function() {
        document.getElementById("agb").style.display = "none";
        // Aktivierung des Nächster Schritt-Buttons nach Bestätigung der AGB
        nextStepButton.disabled = false;
    });

    const addressRadios = document.querySelectorAll('input[name="sameAddress"]');
    const pickupAddressField = document.getElementById("pickupAddressField");
    addressRadios.forEach(radio => {
        radio.addEventListener("change", function() {
            pickupAddressField.style.display = radio.value === "nein" ? "block" : "none";
            // Überprüfen der Pflichtfelder, wenn sich die Auswahl ändert
            checkRequiredFields();
        });
    });

    // Zusammenfassung anzeigen
    nextStepButton.addEventListener("click", function() {
        // Eingaben sammeln
        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        const phone = document.getElementById("phone").value;
        const email = document.getElementById("email").value;
        const sameAddress = document.querySelector('input[name="sameAddress"]:checked').value;
        const pickupAddress = sameAddress === "nein" ? {
            street: document.getElementById("pickupStreet").value,
            postal: document.getElementById("pickupPostal").value,
            city: document.getElementById("pickupCity").value,
        } : null;

        // Rechnungsadresse immer sammeln
        const billingAddress = {
            street: document.getElementById("billingStreet").value,
            postal: document.getElementById("billingPostal").value,
            city: document.getElementById("billingCity").value,
        };

        // Zusammenfassung erstellen
        const summaryContent = `
            <p><strong>Vorname:</strong> ${firstName}</p>
            <p><strong>Nachname:</strong> ${lastName}</p>
            <p><strong>Telefonnummer:</strong> ${phone}</p>
            <p><strong>E-Mail:</strong> ${email}</p>
            <p><strong>Abholadresse identisch mit Rechnungsadresse:</strong> ${sameAddress}</p>
            <h4>Rechnungsadresse:</h4>
            <p><strong>Straße:</strong> ${billingAddress.street}</p>
            <p><strong>PLZ:</strong> ${billingAddress.postal}</p>
            <p><strong>Ort:</strong> ${billingAddress.city}</p>
            ${sameAddress === "nein" ? `
                <h4>Abholadresse:</h4>
                <p><strong>Straße:</strong> ${pickupAddress.street}</p>
                <p><strong>PLZ:</strong> ${pickupAddress.postal}</p>
                <p><strong>Ort:</strong> ${pickupAddress.city}</p>
            ` : ''}
        `;

        document.getElementById("summaryContent").innerHTML = summaryContent;

        // Kontaktformular ausblenden und Zusammenfassung anzeigen
        contactSection.style.display = "none"; 
        summarySection.style.display = "block"; // Zusammenfassung anzeigen
    });
});

   // Anfrage absenden
document.getElementById("submitRequestButton").addEventListener("click", function(event) {
    event.preventDefault(); // Verhindert das Standardverhalten des Buttons
    const form = document.querySelector("#contact form");
    const formData = new FormData(form); // Erstellt ein FormData-Objekt aus dem Formular

    fetch('/.netlify/functions/submit-form', {
        method: 'POST',
        body: formData, // Sendet das FormData-Objekt
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            alert("Ihre Anfrage wurde erfolgreich gesendet!");
            form.reset();
        } else {
            alert("Es gab ein Problem beim Senden Ihrer Anfrage. Bitte versuchen Sie es erneut.");
        }
    })
    .catch(error => {
        alert("Fehler beim Senden der Anfrage: " + error);
    });
});
