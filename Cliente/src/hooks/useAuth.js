import { useState, useEffect, useCallback, useMemo } from "react";
import { authService } from "../services/auth";

export const useAuth = () => {
  const [state, setState] = useState({
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null
  });

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearState = useCallback(() => {
    setState({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });
  }, []);

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
      clearState();
      return { isAuthenticated: false, user: null };
    }
  }, [updateState, clearState]);

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
          error: error.message || "Error en inicio de sesión" 
        });
        throw error;
      }
    },
    [updateState]
  );

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
          error: error.message || "Error en registro" 
        });
        throw error;
      }
    },
    [updateState]
  );

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
    setState(prev => ({ ...prev, error: null }));
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