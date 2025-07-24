 const form = document.getElementById('contactForm');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const nombre = encodeURIComponent(document.getElementById('nombre').value);
      const email = encodeURIComponent(document.getElementById('email').value);
      const mensaje = encodeURIComponent(document.getElementById('mensaje').value);

      const asunto = `Consulta de ${nombre}`;
      const cuerpo = `Nombre: ${nombre}%0ACorreo: ${email}%0A%0AMensaje:%0A${mensaje}`;

      window.location.href = `mailto:barbamateo89@gmail.com?subject=${asunto}&body=${cuerpo}`;
    });


    //TIENE USO DE CONST ASI QUE HAY QUE CAMBIARLO A ES5