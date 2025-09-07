// dom.js
import { login, logout } from "./auth.js";

export function setupLogin() {
  const inputUserName = document.querySelector("#userName");
  const inputpassword = document.querySelector("#password");
  const btnLogin = document.querySelector("#btnLogin");

  if (btnLogin && inputUserName && inputpassword) {
    btnLogin.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        btnLogin.disabled = true;
        btnLogin.textContent = "Iniciando sesión";
        const success = await login(
          inputUserName.value,
          inputpassword.value
        );
        if (success) {
          setTimeout(() => {
            window.location.href = "principal.html"; // Redirigir despues del login
          }, 500);
        }
      } catch (error) {
        alert(error.message); // Mostrar mensaje de error
      } finally {
        // Restaurar botón siempre
        btnLogin.disabled = false;
        btnLogin.textContent = "Iniciar Sesión";
      }
    });
  }
}

export function setupLogout() {
  const btnCerrarSesion = document.querySelector("#cerrarSesion");

  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        btnCerrarSesion.disabled= true;
        btnCerrarSesion.textContent="Cerrando sesión";
       const success= await logout();
       if(success){
       setTimeout(()=>{
        window.location.href = "index.html?logout=success"; // Redirigir al login
        },500);
        
       }
      } catch (error) {
        // redirigir pero mostrar mensaje error
        window.location.href =
          "index.html?logout=error&message=" +
          encodeURIComponent(error.message);
      }
    });
  }
}
