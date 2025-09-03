import { setAccessToken, getAccessToken } from "../accessTokenEstado.js";
import { api } from "../utils/apiCliente.js";

export async function login(nombreUsuario, contrasenaUsuario) {
  const urlUsuarioLogin = "http://localhost:3000/auth/login";

  try {
    const dispositivoInfo = getDispositivoInfo();
    const response = await fetch(urlUsuarioLogin, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Dispositivo-Info": JSON.stringify(dispositivoInfo),
      },
      body: JSON.stringify({ nombreUsuario, contrasena: contrasenaUsuario }),
      credentials: "include",
    });

    const datos = await response.json();
    console.log("DATOS DEL USUARIO ++++", datos);
    if (response.ok) {
      sessionStorage.setItem("idUsuario", datos.data.usuario.idUsuario);
      sessionStorage.setItem("usuario", JSON.stringify(datos.data.usuario));
      setAccessToken(datos.data.accessToken);

      return true; // Login exitoso
    } else {
      throw new Error(datos.mensaje || "Error al iniciar sesión");
    }
  } catch (error) {
    console.error("Hubo un error con la solicitud de login:", error);
    throw error;
  }
}

// export async function logout() {
//   try {
//     console.log("Iniciando proceso de logout...");
 
//     const respuesta = await api.post("/auth/logout");
    
//     console.log("LOGOUT EXITOSO ++++", respuesta);
 
//     sessionStorage.removeItem("idUsuario");
//     sessionStorage.removeItem("usuario");
//     sessionStorage.removeItem("accessToken");
   
    
//     return { 
//       success: true, 
//       message: "Logout exitoso",
//       data: respuesta 
//     };
    
//   } catch (error) {
//     console.error("Error en el proceso de logout:", error);
    

//     sessionStorage.removeItem("idUsuario");
//     sessionStorage.removeItem("usuario");
//     sessionStorage.removeItem("accessToken");
//     // Relanzar el error para que el llamador pueda manejarlo
//     throw new Error(error.message || "Error al cerrar sesión");
//   }
// }

export async function logout() {
  // Limpiar UI inmediatamente
  limpiarEstadoUI();
  
  try {
    console.log("Iniciando proceso de logout...");
    

    const respuesta = await api.post("/auth/logout");
    
    console.log("Logout exitoso", respuesta);
    
    return { 
      success: true, 
      message: "Logout exitoso",
      data: respuesta 
    };
    
  } catch (error) {
    console.warn("Error durante logout (limpiando estado local):", error);
    
    // si el servidor falla limpiar 
    return { 
      success: false, 
      message: "Sesión local cerrada, pero error en servidor",
      error: error.message 
    };
    
  } finally {
    limpiarEstadoLocal();
  }
}

export async function renovarAccessToken() {
  const url = "http://localhost:3000/auth/renovar-access-token";
  try {
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Error al refrescar el access token");
    }
    const data = await response.json();

    return data.data;
  } catch (error) {
    console.error("Error renovar access token:", error);
    throw error;
  }
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


function limpiarEstadoLocal() {
  // Limpiar sessionStorage
  sessionStorage.removeItem("idUsuario");
  sessionStorage.removeItem("usuario");
  sessionStorage.removeItem("accessToken");
  
  // Limpiar localStorage 
  localStorage.removeItem("rememberMe");
  localStorage.removeItem("userPreferences");
  
  // Limpiar cookies del dominio 
//ocument.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  
  // Limpiar estado en memoria
  if (window.__APP_STATE__) {
    window.__APP_STATE__.user = null;
    window.__APP_STATE__.auth = null;
  }
}

function limpiarEstadoUI() {
  const elementosAutenticados = document.querySelectorAll('[data-auth="true"]');
  const elementosNoAutenticados = document.querySelectorAll('[data-auth="false"]');
  
  elementosAutenticados.forEach(el => el.style.display = 'none');
  elementosNoAutenticados.forEach(el => el.style.display = 'block');
  
  document.body.classList.add('logging-out');
}
