// dom.js
import { login, cerrarSesion } from "./auth.js";

export function setupLogin() {
  const inputNombreUsuario = document.querySelector("#nombreUsuario");
  const inputContrasenaUsuario = document.querySelector("#contrasenaUsuario");
  const btnLogin = document.querySelector("#btnLogin");

  if (btnLogin && inputNombreUsuario && inputContrasenaUsuario) {
    btnLogin.addEventListener("click", async () => {
      try {
        const success = await login(inputNombreUsuario.value, inputContrasenaUsuario.value);
        if (success) {
          window.location.href = "principal.html"; // Redirigir después del login
        }
      } catch (error) {
        alert(error.message); // Mostrar mensaje de error
      }
    });
  }
}

export function setupLogout() {
  const btnCerrarSesion = document.querySelector("#cerrarSesion");

  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", () => {
      cerrarSesion();
      window.location.href = "index.html"; // Redirigir al login
    });
  }
}