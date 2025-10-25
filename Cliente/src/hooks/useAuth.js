import { useState, useEffect, useCallback, useMemo } from "react";
import { authService } from "../services/auth";

export const useAuth = () => {
  const [authState, setAuthState] = useState({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  const updateAuthState = useCallback((updates) => {
    setAuthState((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearAuthState = useCallback(() => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      loading: false,
    });
    authService.clearLocalState();
  }, []);

  const verifySession = useCallback(async () => {
    try {
      updateAuthState({ loading: true });
      const result = await authService.verifySession();

      updateAuthState({
        isAuthenticated: result.isAuthenticated,
        user: result.user,
        loading: false,
      });

      return result;
    } catch (error) {
      console.warn("Error verifying session:", error);
      clearAuthState();
      return { isAuthenticated: false, user: null };
    }
  }, [updateAuthState, clearAuthState]);

  const login = useCallback(
    async (username, password) => {
      try {
        updateAuthState({ loading: true });
        const response = await authService.login(username, password);

        updateAuthState({
          isAuthenticated: true,
          user: response.data,
          loading: false,
        });

        return response;
      } catch (error) {
        updateAuthState({ loading: false });
        throw error;
      }
    },
    [updateAuthState]
  );

  const register = useCallback(
    async (userData) => {
      try {
        updateAuthState({ loading: true });
        const response = await authService.register(userData);
        updateAuthState({ loading: false });
        return response;
      } catch (error) {
        updateAuthState({ loading: false });
        throw error;
      }
    },
    [updateAuthState]
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
      clearAuthState();
    }
  }, [clearAuthState]);
  useEffect(() => {
    verifySession();
  }, [verifySession]);

  return useMemo(
    () => ({
      ...authState,
      login,
      register,
      logout,
      verifySession,
    }),
    [authState, login, register, logout, verifySession]
  );
};
