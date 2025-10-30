import { useState, useCallback } from "react";
import {
  updateUserProfile,
  changePassword,
  deleteUserAccount,
} from "../services/user";

export const useUser = () => {
  const [state, setState] = useState({
    loading: false,
    error: null
  });

  const updateProfile = useCallback(async (profileData) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await updateUserProfile(profileData);
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || "Error actualizando perfil" 
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const updatePassword = useCallback(async (passwordData) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await changePassword(passwordData);
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || "Error cambiando contraseña" 
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await deleteUserAccount();
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || "Error eliminando cuenta" 
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    updateProfile,
    updatePassword,
    deleteAccount,
    clearError,
  };
};
