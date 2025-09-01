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