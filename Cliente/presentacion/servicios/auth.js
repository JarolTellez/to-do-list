
export async function login(nombreUsuario, contrasenaUsuario) {
    const urlUsuarioLogin = "http://localhost:3000/usuario/login";
  
    try {
      const response = await fetch(urlUsuarioLogin, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombreUsuario, contrasena: contrasenaUsuario }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        sessionStorage.setItem("idUsuario", data.usuario.idUsuario);
        return true; // Login exitoso
      } else {
        throw new Error(data.mensaje || "Error al iniciar sesión");
      }
    } catch (error) {
      console.error("Hubo un error con la solicitud de login:", error);
      throw error;
    }
  }
  
  export function cerrarSesion() {
    sessionStorage.removeItem("idUsuario");
  }
  
  export function verificarSesion() {
    const idUsuario = sessionStorage.getItem("idUsuario");
    if (!idUsuario) {
      window.location.href = "index.html"; // Redirigir al login si no hay sesión
    }
  }