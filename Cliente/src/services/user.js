import { api } from "./apiClient.js";
import { userMappers } from '../mappers/userMapper.js';

function getAuthToken() {
  const token = localStorage.getItem("accessToken");
  return token;
}

export async function getUserProfile() {
  try {
    const response = await api.get("/user/profile");
    return userMappers.apiToUser(response.data);
  } catch (error) {
    throw error;
  }
}

export async function updateUserProfile(profileData) {
  const url = "http://localhost:3000/user/";
  const token = getAuthToken();

  try {
    const updateDTO = userMappers.userToUpdateDTO(profileData);
    
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updateDTO),
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
      return { success: true, data: userMappers.apiToUser(data.data) };
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

export async function changePassword(passwordData) {
  const url = "http://localhost:3000/user/change-password";
  const token = getAuthToken();

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(passwordData),
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

export async function deleteUserAccount() {
  const url = "http://localhost:3000/user/";
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
      clearLocalState();
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

function clearLocalState() {
  sessionStorage.removeItem("userId");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("rememberMe");
  localStorage.removeItem("userPreferences");
}