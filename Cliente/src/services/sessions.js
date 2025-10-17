import { api } from "./apiClient.js";
import { sessionMappers } from '../mappers/sessionMapper.js';

function getAuthToken() {
  const token = localStorage.getItem("accessToken");
  return token;
}

export async function getUserSessions() {
  const url = "http://localhost:3000/auth/active-sessions";
  const token = getAuthToken();

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
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
      const sessions = data.data.sessions?.map(sessionMappers.apiToSession) || [];
      return { success: true, sessions };
    } else {
      const errorMessage = data.message || data.mensaje || `Error ${response.status}`;
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message || "Error de conexión" 
    };
  }
}

export async function closeAllSessions() {
  const url = "http://localhost:3000/auth/close-all-sessions";
  const token = getAuthToken();

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
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
      return { success: true, data };
    } else {
      const errorMessage = data.message || data.mensaje || `Error ${response.status}`;
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message || "Error de conexión" 
    };
  }
}

export async function closeSession(sessionId) {
  const url = `http://localhost:3000/auth/session/${sessionId}`;
  const token = getAuthToken();

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
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
      return { success: true, data };
    } else {
      const errorMessage = data.message || data.mensaje || `Error ${response.status}`;
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message || "Error de conexión" 
    };
  }
}