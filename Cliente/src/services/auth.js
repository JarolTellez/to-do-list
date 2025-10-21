import { apiClient } from "./api/clients/apiClient.js";
import { userMappers } from "../mappers/userMapper.js";
import { handleErrorResponse, handleApiResponse } from "./api/utils/httpUtils.js";

export class AuthService {
async login(username, password) {
  try {
    const userLoginDTO = userMappers.inputToLoginDTO({
      identifier: username,
      password,
    });

    const response = await apiClient.api.post("/auth/login", userLoginDTO);
    const userData = userMappers.apiToUser(response.data);
    const authResponse = {
      data: userData,
      message: response.message,
      expiresIn: response.data.expiresIn,
      expiresAt: response.data.expiresAt,
      tokenType: response.data.tokenType,
    };

    this.saveUserInfo(userData);
    return authResponse;
  } catch (error) {
    console.error("Error in login:", error);
    throw error;
  }
}

 async logout() {
  try {
    const response = await apiClient.api.post("/auth/logout");

    return { data: response.data, message: response.message };
  } catch (error) {
    console.error("Error login out:", error);
    throw error;
  } finally {
    this.clearLocalState();
  }
}

 async verifySession() {
    try {
      const response = await apiClient.api.get("/auth/verify-session");
      return {
        isAuthenticated: response.isAuthenticated,
        user: response.data ? userMappers.apiToUser(response.data) : null,
        message: response.message,
        tokenRefreshed: response.tokenRefreshed || false
      };
    } catch (error) {
      console.error("Error verifying session:", error);
      throw error;
    }
  }


async refreshAccessToken() {
  try {
    
      const response = await fetch(`${this.baseURL}/auth/refresh-access-token`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const response= await handleApiResponse(response);
         return { data: response.data, message: response.message };
      } else {
        const error = await handleErrorResponse(response);
        throw error;
      }
   
  } catch (error) {
    console.error("Error refreshing accessToken:", error);
    throw error;
  }
}

 async register(userData) {
  try {
    const registerDTO = userMappers.inputToRegisterDTO(userData);
    const response = await apiClient.api.post("/user/", registerDTO);
    const mappedUser = userMappers.apiToUser(response.data);

    return { data: mappedUser, message: response.message };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

 saveUserInfo(userData) {
    sessionStorage.setItem("userId", userData.id);
    sessionStorage.setItem("userEmail", userData.email);
    sessionStorage.setItem("userUsername", userData.username);
  }


clearLocalState() {
  sessionStorage.removeItem("userId");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("rememberMe");
  localStorage.removeItem("userPreferences");
}
}
export const authService = new AuthService();
