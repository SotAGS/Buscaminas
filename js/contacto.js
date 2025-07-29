 var form = document.getElementById('contactForm');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nombre = encodeURIComponent(document.getElementById('nombre').value);
      var email = encodeURIComponent(document.getElementById('email').value);
      var mensaje = encodeURIComponent(document.getElementById('mensaje').value);

      var asunto = 'Consulta de '+ nombre;
      var cuerpo = 'Nombre: ' + nombre + '%0ACorreo: ' + email + '%0A%0AMensaje:%0A' + mensaje;

      window.location.href = 'mailto:barbamateo89@gmail.com?subject=' + asunto + 'body=' +cuerpo;
    });
    