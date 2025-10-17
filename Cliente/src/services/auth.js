import { setAccessToken, getAccessToken, removeAccessToken } from "../utils/tokenStorage.js";
import { userMappers } from '../mappers/userMapper.js';

function getAuthToken() {
  const token = getAccessToken();
  return token;
}

export async function login(username, password) {
  const url = "http://localhost:3000/auth/login";

  try {
    const deviceInfo = getDeviceInfo();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ identifier: username, password: password, deviceInfo: deviceInfo  }),
      credentials: "include",
    });

    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      return { 
        success: false, 
        error: "Error del servidor. Intente más tarde." 
      };
    }

    const data = await response.json();

    if (response.ok) {
      const userData = userMappers.apiToUser(data.data.user);
      
      sessionStorage.setItem("userId", userData.id);
      sessionStorage.setItem("userEmail", userData.email);
      sessionStorage.setItem("userUsername", userData.username);
      
      setAccessToken(data.data.accessToken);
      
      return { 
        success: true, 
        user: userData
      };
    } else {
      const errorMessage = data.message || data.mensaje || `Error ${response.status}`;
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    if (error.message.includes('JSON') || error.message.includes('Unexpected token')) {
      return { 
        success: false, 
        error: "Error de comunicación con el servidor" 
      };
    }
    
    return { 
      success: false, 
      error: error.message || "Error de conexión" 
    };
  }
}

export async function logout() {
  try {
    const token = getAuthToken();
    
    if (token) {
      const response = await fetch("http://localhost:3000/auth/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        credentials: "include",
      });

      if (!response.ok) {
      }
    }
    
    return { success: true };
  } catch (error) {
    return { success: true };
  } finally {
    clearLocalState();
  }
}

export async function refreshAccessToken() {
  const url = "http://localhost:3000/auth/refresh-access-token";
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
    throw error;
  }
}

export async function register(userData) {
  try {
    const registerDTO = userMappers.inputToRegisterDTO(userData);
    
    const url = "http://localhost:3000/user/";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerDTO),
    });

    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      return { 
        success: false, 
        error: "Error del servidor. Intente más tarde." 
      };
    }

    const data = await response.json();

    if (response.ok) {
      return { success: true };
    } else {
      const errorMessage = data.message || data.mensaje || `Error ${response.status}`;
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    if (error.message.includes('JSON') || error.message.includes('Unexpected token')) {
      return { 
        success: false, 
        error: "Error de comunicación con el servidor. Verifique su conexión." 
      };
    }
    
    return { 
      success: false, 
      error: error.message || "Error de conexión" 
    };
  }
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
  sessionStorage.removeItem("userId");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("rememberMe");
  localStorage.removeItem("userPreferences");
}