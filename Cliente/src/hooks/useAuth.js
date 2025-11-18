import { useState, useEffect, useCallback, useMemo } from "react";
import { authService } from "../services/auth";

/**
 * Authentication state management hook
 * @hook useAuth
 * @description Manages user authentication state, login, logout, and session verification
 * @returns {Object} Authentication state and methods
 */
export const useAuth = () => {
  const [state, setState] = useState({
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  const updateState = useCallback((updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearState = useCallback(() => {
    setState({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  }, []);

  /**
   * Verifies current user session
   * @async
   * @function verifySession
   * @returns {Promise<Object>} Session verification result
   */
  const verifySession = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      const result = await authService.verifySession();

      updateState({
        isAuthenticated: result.isAuthenticated,
        user: result.user,
        loading: false,
      });

      return result;
    } catch (error) {
      console.warn("Error verifying session:", error);
      if (
        error.message?.includes("No hay sesión activa") ||
        error.code === "NO_ACTIVE_SESSION" ||
        error.code === "INVALID_SESSION"
      ) {
        updateState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      } else {
        updateState({
          loading: false,
          error: error.message || "Error verificando sesión",
        });
      }

      return { isAuthenticated: false, user: null };
    }
  }, [updateState]);

  /**
   * Handles user login
   * @async
   * @function login
   * @param {string} username - User username
   * @param {string} password - User password
   * @returns {Promise<Object>} Login result
   */
  const login = useCallback(
    async (username, password) => {
      try {
        updateState({ loading: true, error: null });
        const response = await authService.login(username, password);

        updateState({
          isAuthenticated: true,
          user: response.data,
          loading: false,
        });

        return response;
      } catch (error) {
        updateState({
          loading: false,
          error: error.message || "Error en inicio de sesión",
        });
        throw error;
      }
    },
    [updateState]
  );

  /**
   * Handles user registration
   * @async
   * @function register
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result
   */
  const register = useCallback(
    async (userData) => {
      try {
        updateState({ loading: true, error: null });
        const response = await authService.register(userData);
        updateState({ loading: false });
        return response;
      } catch (error) {
        updateState({
          loading: false,
          error: error.message || "Error en registro",
        });
        throw error;
      }
    },
    [updateState]
  );

  /**
   * Handles user logout
   * @async
   * @function logout
   * @returns {Promise<Object>} Logout result
   */
  const logout = useCallback(async () => {
    try {
      const response = await authService.logout();
      return response;
    } catch (error) {
      console.warn("Error durante logout:", error);
      if (
        error.message?.includes("No hay sesión activa") ||
        error.code === "EMPTY_TOKEN" ||
        error.status === 401
      ) {
        return { data: { success: true }, message: "Sesión cerrada" };
      }
      throw error;
    } finally {
      clearState();
    }
  }, [clearState]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  return useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      verifySession,
      clearError,
    }),
    [state, login, register, logout, verifySession, clearError]
  );
};
