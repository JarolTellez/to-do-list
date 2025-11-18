import { useState, useCallback } from "react";
import {
  updateUserProfile,
  changePassword,
  deleteUserAccount,
} from "../services/user";

/**
 * User profile management hook
 * @hook useUser
 * @description Handles user profile updates, password changes, and account deletion
 * @returns {Object} User management state and methods
 */
export const useUser = () => {
  const [state, setState] = useState({
    loading: false,
    error: null,
  });

  /**
   * Updates user profile data
   * @async
   * @function updateProfile
   * @param {Object} profileData - Updated profile data
   * @returns {Promise<Object>} Update result
   */
  const updateProfile = useCallback(async (profileData) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await updateUserProfile(profileData);
      return result;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message || "Error actualizando perfil",
      }));
      throw error;
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  /**
   * Updates user password
   * @async
   * @function updatePassword
   * @param {Object} passwordData - Password change data
   * @returns {Promise<Object>} Update result
   */
  const updatePassword = useCallback(async (passwordData) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await changePassword(passwordData);
      return result;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message || "Error cambiando contraseña",
      }));
      throw error;
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  /**
   * Deletes user account
   * @async
   * @function deleteAccount
   * @returns {Promise<Object>} Deletion result
   */
  const deleteAccount = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await deleteUserAccount();
      return result;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message || "Error eliminando cuenta",
      }));
      throw error;
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    updateProfile,
    updatePassword,
    deleteAccount,
    clearError,
  };
};
