import { authClient } from "./api/clients/authClient.js";
import { api } from "./api/clients/apiClient.js";
import {
  setAccessToken,
  getAccessToken,
  removeAccessToken,
} from "../utils/tokenStorage.js";
import { userMappers } from "../mappers/userMapper.js";

function getAuthToken() {
  const token = getAccessToken();
  return token;
}

export async function login(username, password) {
  try {
    const deviceInfo = getDeviceInfo();
    const userLoginDTO = userMappers.inputToLoginDTO({
      identifier: username,
      password,
      deviceInfo,
    });

    const response = await authClient.post("/auth/login", userLoginDTO, {
      headers: {
        "Dispositivo-Info": JSON.stringify(deviceInfo),
      },
    });

    const userData = userMappers.apiToUser(response.data.user);

    sessionStorage.setItem("userId", userData.id);
    sessionStorage.setItem("userEmail", userData.email);
    sessionStorage.setItem("userUsername", userData.username);

    setAccessToken(response.data.accessToken);

    return {
      success: true,
      user: userData,
    };
  } catch (error) {
    console.error("Error in login:", error);
    throw error;
  }
}

export async function logout() {
  try {
    const token = getAuthToken();

    if (token) {
      await api.post("/auth/logout");
    }
    return { success: true };
  } catch (error) {
    console.error("Error login out:", error);
    throw error;
  } finally {
    clearLocalState();
  }
}

export async function refreshAccessToken() {
  try {
    const response = await authClient.post("/auth/refresh-access-token");
    return response.data;
  } catch (error) {
    if (error.status == 401) {
      console.error("No active session:", error);
      throw error;
    }
    console.error("Error refreshing accessToken:", error);
    throw error;
  }
}

export async function register(userData) {
  try {
    const registerDTO = userMappers.inputToRegisterDTO(userData);
    const data = await authClient.post("/user/", registerDTO);

    if (data.success === false) {
      return { success: false, error: data.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
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
