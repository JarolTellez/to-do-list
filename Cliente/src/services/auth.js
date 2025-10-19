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
    const userLoginDTO = userMappers.inputToLoginDTO({
      identifier: username,
      password,
    });

  
    const response = await authClient.post("/auth/login", userLoginDTO);


    const userData = userMappers.apiToUser(response.data.user);
    const authResponse = {
      data: userData,
      message: response.message,
      accessToken: response.data.accessToken,
      expiresIn: response.data.expiresIn,
      expiresAt: response.data.expiresAt,
      tokenType: response.data.tokenType,
    };


    sessionStorage.setItem("userId", userData.id);
    sessionStorage.setItem("userEmail", userData.email);
    sessionStorage.setItem("userUsername", userData.username);

    setAccessToken(response.data.accessToken);

    return authResponse;
  } catch (error) {
    console.error("Error in login:", error);
    throw error;
  }
}

export async function logout() {
  try {
    const response = await api.post("/auth/logout");

    return { data: response.data, message: response.message };
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
    return { data: response.data, message: response.message };
  } catch (error) {
    console.error("Error refreshing accessToken:", error);
    throw error;
  }
}

export async function register(userData) {
  try {
    const registerDTO = userMappers.inputToRegisterDTO(userData);
    const response = await authClient.post("/user/", registerDTO);
    const mappedUser = userMappers.apiToUser(response.data);

    return { data: mappedUser, message: response.message };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

function clearLocalState() {
  sessionStorage.removeItem("userId");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("rememberMe");
  localStorage.removeItem("userPreferences");
}
