'use strict';

document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('contactForm');
    var nameInput = document.getElementById('nombre');
    var emailInput = document.getElementById('email');
    var messageInput = document.getElementById('mensaje');
    var errorMessage = document.getElementById('error-message'); // Asume que tienes un elemento con este ID para mostrar los errores.

    if (form && nameInput && emailInput && messageInput) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Clear previous errors
            if (errorMessage) {
                errorMessage.textContent = '';
            }

            var isValid = true;
            
            // Validate Name
            if (nameInput.value.trim() === '') {
                isValid = false;
                if (errorMessage) {
                    errorMessage.textContent = 'Por favor, ingresa tu nombre.';
                }
            }

            // Validate Email
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (isValid && !emailRegex.test(emailInput.value.trim())) {
                isValid = false;
                if (errorMessage) {
                    errorMessage.textContent = 'Por favor, ingresa un correo electrónico válido.';
                }
            }

            // Validate Message
            if (isValid && messageInput.value.trim() === '') {
                isValid = false;
                if (errorMessage) {
                    errorMessage.textContent = 'Por favor, ingresa tu mensaje.';
                }
            }

            if (isValid) {
                var name = encodeURIComponent(nameInput.value);
                var email = encodeURIComponent(emailInput.value);
                var message = encodeURIComponent(messageInput.value);

                var subject = 'Consulta de ' + name;
                var body = 'Nombre: ' + name + '%0ACorreo: ' + email + '%0A%0AMensaje:%0A' + message;

                window.location.href = 'mailto:barbamateo89@gmail.com?subject=' + subject + '&body=' + body;
            }
        });
    } else {
        console.error("Error: No se encontró el formulario con ID 'contactForm' o alguno de sus campos en contacto.html");
    }
});