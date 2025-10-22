import { useCallback, useState } from "react";
import {
  updateUserProfile,
  changePassword,
  deleteUserAccount,
} from "../services/user";

export const useUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateProfile = useCallback(async (profileData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateUserProfile(profileData);
      return result;
    } catch (error) {
      setError(error.message || "Error actualizando perfil");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePassword = useCallback(async (passwordData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await changePassword(passwordData);
      return result;
    } catch (error) {
      setError(error.message || "Error cambiando contraseña");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await deleteUserAccount();
      return result;
    } catch (error) {
      setError(error.message || "Error eliminando cuenta");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    updateProfile,
    updatePassword,
    deleteAccount,
  };
};
