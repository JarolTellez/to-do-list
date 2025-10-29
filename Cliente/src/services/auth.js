import { apiClient } from "./api/clients/apiClient.js";
import { userMappers } from "../mappers/userMapper.js";

export class AuthService {
  async login(username, password) {
    try {
      const userLoginDTO = userMappers.inputToLoginDTO({
        identifier: username,
        password,
      });

      const response = await apiClient.api.post("/auth/login", userLoginDTO);

      if (!response.success) {
        throw new Error(response.message || "Error en inicio de sesión");
      }

      const userData = userMappers.apiToUser(response.data);

      const authResponse = {
        data: userData,
        message: response.message,
        expiresIn: response.data.expiresIn,
        expiresAt: response.data.expiresAt,
        tokenType: response.data.tokenType,
      };

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
      console.error("Error logging out:", error);

      if (
        error.message?.includes("No hay sesión activa") ||
        error.code === "EMPTY_TOKEN" ||
        error.status === 401
      ) {
        return { data: { success: true }, message: "Sesión cerrada" };
      }

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
        tokenRefreshed: response.tokenRefreshed || false,
      };
    } catch (error) {
      console.error("Error verifying session:", error);

      if (error.message?.includes("No hay sesión activa")) {
        return {
          isAuthenticated: false,
          user: null,
          message: "No hay sesión activa",
        };
      }

      throw error;
    }
  }

  async refreshAccessToken() {
    try {
      const response = await apiClient.api.post("/auth/refresh-access-token");
      return { data: response.data, message: response.message };
    } catch (error) {
      console.error("Error refreshing accessToken:", error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const registerDTO = userMappers.inputToRegisterDTO(userData);
      const response = await apiClient.api.post("/user/", registerDTO);

      if (!response.success) {
        throw new Error(response.message || "Error en registro");
      }

      const mappedUser = userMappers.apiToUser(response.data);
      return { data: mappedUser, message: response.message };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
}

export const authService = new AuthService();
