
export async function login(nombreUsuario, contrasenaUsuario) {
    const urlUsuarioLogin = "http://localhost:3000/auth/login";
  
    try {
       const dispositivoInfo = getDispositivoInfo();
      const response = await fetch(urlUsuarioLogin, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Dispositivo-Info": JSON.stringify(dispositivoInfo)
        },
        body: JSON.stringify({ nombreUsuario, contrasena: contrasenaUsuario }),
        credentials: "include"
      });
    
      const datos = await response.json();
      console.log("DATOS DEL USUARIO ++++", datos);
      if (response.ok) {
         sessionStorage.setItem("idUsuario", datos.data.usuario.idUsuario);
        sessionStorage.setItem("usuario", JSON.stringify(datos.data.usuario));
        return true; // Login exitoso
      } else {
        throw new Error(datos.mensaje || "Error al iniciar sesión");
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

  function getDispositivoInfo() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenWidth: screen.width,
    screenHeight: screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

  
  