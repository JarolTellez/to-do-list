document.addEventListener("DOMContentLoaded", function () {
  const inputNombreUsuario = document.querySelector("#nombreUsuario");
  const inputContrasenaUsuario = document.querySelector("#contrasenaUsuario");
  const btnLogin = document.querySelector("#btnLogin");
  const btnCerrarSesion = document.querySelector("#cerrarSesion");

  btnLogin.addEventListener("click", function () {
    login();
  });

  btnCerrarSesion.addEventListener("click", function () {
    cerrarSesion();
  });

  async function login() {
    const usuarioLogin = {
      nombreUsuario: inputNombreUsuario.value,
      contrasena: inputContrasenaUsuario.value,
    };
    const urlUsuarioLogin = "http://localhost:3000/usuario/login";

    try {
      const response = await fetch(urlUsuarioLogin, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(usuarioLogin),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem("idUsuario", data.usuario.idUsuario);
        console.log("Login exitoso:", data);
        alert("Login exitoso!");
        window.location.href = "principal.html";
      } else {
        console.log("Error al iniciar sesion:", data.mensaje);
        alert(data.mensaje);
      }
    } catch (error) {
      console.error("Hubo un error con la solicitud de login:", error);
      alert("Hubo un error con la solicitud de login.");
    }
  }

  function cerrarSesion() {
    console.log("Cerrando sesion ");
    window.location.href = "index.html";
  }
});
