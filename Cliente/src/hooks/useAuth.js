import { useState, useEffect, useCallback } from "react";
import { authService } from "../services/auth.js";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const verifySession = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.verifySession();

      setIsAuthenticated(result.isAuthenticated);
      setUser(result.user);

      return result;
    } catch (err) {
      setError(err.message);
      setIsAuthenticated(false);
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const attemptTokenRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.refreshAccessToken();

      if (response.data) {
        sessionStorage.setItem("userId", response.data.user.id);
        sessionStorage.setItem("userEmail", response.data.user.email);
        sessionStorage.setItem("userUsername", response.data.user.username);
        setUser(response.data.user);
      }

      return response;
    } catch (error) {
      clearAuthState();
      setError(error.message || "Error de autenticacion");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearAuthState = () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userUsername");
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleLogin = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login(username, password);

      setIsAuthenticated(true);
      setUser(response.data);
      return response;
    } catch (error) {
      setError(error.message || "Error al iniciar sesión");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      setError(error.message || "Error al registrar usuario");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.logout();
      return response;
    } catch (error) {
      setError(error.message || "Error al cerrar sesion");
      throw error;
    } finally {
      clearAuthState();
      setLoading(false);
    }
  };

  useEffect(() => {
    verifySession();
  },[]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    verifySession,
  };
};
