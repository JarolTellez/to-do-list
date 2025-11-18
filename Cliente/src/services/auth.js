import { apiClient } from "./api/clients/apiClient.js";
import { userMappers } from "../mappers/userMapper.js";

/**
 * Authentication service for handling user authentication operations
 * @class AuthService
 * @description Manages user login, logout, session verification, and registration
 */
export class AuthService {
  /**
   * Authenticates user with credentials
   * @async
   * @function login
   * @param {string} username - User username
   * @param {string} password - User password
   * @returns {Promise<Object>} Authentication response with user data and tokens
   * @throws {Error} When authentication fails
   */
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

  /**
   * Logs out current user session
   * @async
   * @function logout
   * @returns {Promise<Object>} Logout result
   * @throws {Error} When logout fails
   */
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
    }
  }

  /**
   * Verifies current user session validity
   * @async
   * @function verifySession
   * @returns {Promise<Object>} Session verification result
   * @throws {Error} When session verification fails
   */
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
      if (
        error.message?.includes("No hay sesión activa") ||
        error.code === "NO_ACTIVE_SESSION" ||
        error.code === "INVALID_SESSION"
      ) {
        return {
          isAuthenticated: false,
          user: null,
          message: "No hay sesión activa",
        };
      }

      throw error;
    }
  }

  /**
   * Refreshes access token using refresh token
   * @async
   * @function refreshAccessToken
   * @returns {Promise<Object>} Token refresh result
   * @throws {Error} When token refresh fails
   */
  async refreshAccessToken() {
    try {
      const response = await apiClient.api.post("/auth/refresh-access-token");
      return { data: response.data, message: response.message };
    } catch (error) {
      console.error("Error refreshing accessToken:", error);
      throw error;
    }
  }

  /**
   * Registers new user account
   * @async
   * @function register
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result with user data
   * @throws {Error} When registration fails
   */
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
