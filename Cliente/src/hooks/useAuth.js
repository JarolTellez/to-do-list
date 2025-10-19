import { useState, useEffect } from 'react';
import { login, logout, register, refreshAccessToken } from '../services/auth.js';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        const userId = sessionStorage.getItem('userId');
        const userEmail = sessionStorage.getItem('userEmail');
        const userUsername = sessionStorage.getItem('userUsername');
        
        if (userId) {
          setUser({ id: userId, email: userEmail, username: userUsername });
          setIsAuthenticated(true);
        } else {
          await attemptTokenRefresh();
        }
      } else {
        await attemptTokenRefresh();
      }
    } catch (error) {
      console.error('Error auth:', error);
      clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  const attemptTokenRefresh = async () => {
    try {
      const newTokenData = await refreshAccessToken();
      
      if (newTokenData?.accessToken) {
        localStorage.setItem('accessToken', newTokenData.accessToken);
        
        if (newTokenData.user) {
          sessionStorage.setItem('userId', newTokenData.user.id);
          sessionStorage.setItem('userEmail', newTokenData.user.email);
          sessionStorage.setItem('userUsername', newTokenData.user.username);
          setUser(newTokenData.user);
        }
        
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      console.log('Error refreshin accessToken:', error);
      clearAuthState();
      return false;
    }
  };

  const clearAuthState = () => {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userUsername');
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleLogin = async (username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await login(username, password);

      
      if (result) {
        setIsAuthenticated(true);
        setUser(result.data);
        return result.data;
      } else {
        setError(result?.error || 'Error desconocido');
        return result;
      }
    } catch (err) {
      const errorMsg = err.message || 'Error al iniciar sesión';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await register(userData);
      
      if (result?.success) {
        return result;
      } else {
        setError(result?.error || 'Error desconocido');
        return result;
      }
    } catch (err) {
      const errorMsg = err.message || 'Error al registrar usuario';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error durante logout:', error);
    } finally {
      clearAuthState();
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    checkAuthStatus
  };
};