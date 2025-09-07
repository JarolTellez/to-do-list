import { setAccessToken, getAccessToken } from "../accessTokenState.js";
import { api } from "../utils/apiClient.js";

export async function login(userName, password) {
  const url = "http://localhost:3000/auth/login";

  try {
    const deviceInfo = getDeviceInfo();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Dispositivo-Info": JSON.stringify(deviceInfo),
      },
      body: JSON.stringify({ userName, password: password }),
      credentials: "include",
    });

    const data = await response.json();
    console.log("DATOS DEL USUARIO", data);
   
    if (response.ok) {
      sessionStorage.setItem('userId', data.data.user.id);
     // sessionStorage.setItem("user", JSON.stringify(data.data.user));
      setAccessToken(data.data.accessToken);

      return true; // Login exitoso
    } else {
      throw new Error(data.mensaje || "Error al iniciar sesión");
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
 
//     sessionStorage.removeItem("userId");
//     sessionStorage.removeItem("usuario");
//     sessionStorage.removeItem("accessToken");
   
    
//     return { 
//       success: true, 
//       message: "Logout exitoso",
//       data: respuesta 
//     };
    
//   } catch (error) {
//     console.error("Error en el proceso de logout:", error);
    

//     sessionStorage.removeItem("userId");
//     sessionStorage.removeItem("usuario");
//     sessionStorage.removeItem("accessToken");
//     // Relanzar el error para que el llamador pueda manejarlo
//     throw new Error(error.message || "Error al cerrar sesión");
//   }
// }

export async function logout() {
  // Limpiar UI inmediatamente
  clearUIState();
  
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
    clearLocalState();
  }
}

export async function refreshAccessToken() {
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

export function verifySession() {
  const userId = sessionStorage.getItem('userId');
    
    if (!userId) {
        window.location.href = 'index.html'; // Redirige al login
        return false;
    }
    return true;
}



function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenWidth: screen.width,
    screenHeight: screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}


function clearLocalState() {
  // Limpiar sessionStorage
  sessionStorage.removeItem("userId");
  sessionStorage.removeItem("userId");
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

function clearUIState() {
  const elementosAutenticados = document.querySelectorAll('[data-auth="true"]');
  const elementosNoAutenticados = document.querySelectorAll('[data-auth="false"]');
  
  elementosAutenticados.forEach(el => el.style.display = 'none');
  elementosNoAutenticados.forEach(el => el.style.display = 'block');
  
  document.body.classList.add('logging-out');
}
