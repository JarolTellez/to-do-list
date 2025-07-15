// document.addEventListener("DOMContentLoaded", function () {
//   const inputNombreUsuario = document.querySelector("#nombreUsuario");
//   const inputContrasenaUsuario = document.querySelector("#contrasenaUsuario");
//   const btnLogin = document.querySelector("#btnLogin");
//   const btnCerrarSesion = document.querySelector("#cerrarSesion");

//   // Verifica si el botón de login existe en el DOM antes de agregar el event listener
//   if (btnLogin) {
//     btnLogin.addEventListener("click", function () {
//       login();
//     });
//   }

//   // Verifica si el botón de cerrar sesión existe en el DOM antes de agregar el event listener
//   if (btnCerrarSesion) {
//     btnCerrarSesion.addEventListener("click", function () {
//       cerrarSesion();
//     });
//   }

//   async function login() {
//     const usuarioLogin = {
//       nombreUsuario: inputNombreUsuario.value,
//       contrasena: inputContrasenaUsuario.value,
//     };
//     const urlUsuarioLogin = "http://localhost:3000/usuario/login";

//     try {
//       const response = await fetch(urlUsuarioLogin, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(usuarioLogin),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         sessionStorage.setItem("idUsuario", data.usuario.idUsuario);
//         // console.log("Login exitoso:", data);
//         // alert("Login exitoso!");
//         window.location.href = "principal.html";
//       } else {
//         console.log("Error al iniciar sesion:", data.mensaje);
//         alert(data.mensaje);
//       }
//     } catch (error) {
//       console.error("Hubo un error con la solicitud de login:", error);
//       alert("Hubo un error con la solicitud de login.");
//     }
//   }

//   function cerrarSesion() {
//     console.log("Cerrando sesion ");
//     sessionStorage.removeItem("idUsuario"); // Limpia el sessionStorage al cerrar sesión
//     window.location.href = "index.html";
//   }

//   // Verifica si el usuario está logueado al cargar la página principal
//   if (window.location.pathname.includes("principal.html")) {
//     const idUsuario = sessionStorage.getItem("idUsuario");
//     if (!idUsuario) {
//       // Si no hay un usuario logueado, redirige al login
//       window.location.href = "index.html";
//     }
//   }
// });

// login.js
import { setupLogin, setupLogout } from "./dom.js";
import { verificarSesion } from "./auth.js";

document.addEventListener("DOMContentLoaded", function () {
  // Configura eventos de login (solo en index.html)
  setupLogin();

  // Configura eventos de logout (solo en principal.html)
  setupLogout();

  // Verifica sesión al cargar principal.html
  if (window.location.pathname.includes("principal.html")) {
    verificarSesion();
  }
});