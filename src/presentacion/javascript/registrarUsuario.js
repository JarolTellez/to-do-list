const UsuarioController = require("../../logica/UsuarioController.js");
const Usuario = require("../../dominio/Usuario.js");

document.addEventListener("DOMContentLoaded", function () {
  const inputNombreUsuario = document.querySelector("#nombreUsuarioRegistro");
  const inputCorreoUsuario = document.querySelector("#correoUsuarioRegistro");
  const inputContrasenaUsuario = document.querySelector("#contrasenaUsuarioRegistro");
  const botonRegistrar = document.querySelector("#btnRegistrar");

  botonRegistrar.addEventListener("click", function () {
    registrarUsuario();
  });

  function registrarUsuario() {
    const usuarioNuevo = new Usuario(
      null,
      inputNombreUsuario.value,
      inputCorreoUsuario.value,
      inputContrasenaUsuario.value
    );

    const urlUsuario = "http://localhost:3000/usuario/";

    fetch(urlUsuario, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(usuarioNuevo),
    })
      .then((response) => response.json())
      .then((data) => {
        inputNombreUsuario.value = "";
        inputCorreoUsuario.value = "";
        inputContrasenaUsuario.value = "";

        alert("Se ha creado correctamente el usuario");

        window.location.href = "index.html";
      })
      .catch((error) => {
        alert(`Error al crear el usuario presentacion: ${error.message}`);
      });
  }
});
