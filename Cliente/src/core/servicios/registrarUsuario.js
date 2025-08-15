document.addEventListener("DOMContentLoaded", function () {
  const inputNombreUsuario = document.querySelector("#nombreUsuarioRegistro");
  const inputCorreoUsuario = document.querySelector("#correoUsuarioRegistro");
  const inputContrasenaUsuario = document.querySelector(
    "#contrasenaUsuarioRegistro"
  );
  const botonRegistrar = document.querySelector("#btnRegistrar");

  botonRegistrar.addEventListener("click", function () {
    registrarUsuario();
  });

  async function registrarUsuario() {
    const usuarioNuevo = {
      nombreUsuario: inputNombreUsuario.value,
      correo: inputCorreoUsuario.value,
      contrasena: inputContrasenaUsuario.value,
    };

    const urlUsuario = "http://localhost:3000/auth/";

    try {
      const response = await fetch(urlUsuario, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(usuarioNuevo),
      });

      const data = await response.json();

      if (response.ok) {
        inputNombreUsuario.value = "";
        inputCorreoUsuario.value = "";
        inputContrasenaUsuario.value = "";

        alert("Se ha creado correctamente el usuario");

        window.location.href = "index.html";
      } else {
        console.log("Error al Registrar el usuario:", data.mensaje);
        alert(data.mensaje);
      }
    } catch (error) {
      alert(`Error al crear el usuario: ${error.message}`);
    }
  }
});
