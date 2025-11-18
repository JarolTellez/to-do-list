import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "../hooks/useAuth";
import { useLoading } from "../contexts/LoadingContext";
import { useToast } from "../contexts/ToastContexts";

const AuthContext = createContext(null);

/**
 * Authentication context provider for managing user authentication state
 * @context AuthProvider
 * @description Provides authentication state and methods throughout the application
 * @param {Object} props - Component properties
 * @param {ReactNode} props.children - Child components
 * @returns {JSX.Element} Authentication context provider
 */
export const AuthProvider = ({ children }) => {
  const auth = useAuth();
  const { startFullScreenLoading, stopFullScreenLoading } = useLoading();
  const { showToast } = useToast();
  const logoutInProgress = useRef(false);

  /**
   * Enhanced logout function with session expiration handling
   * @async
   * @function enhancedLogout
   * @param {boolean} isAutoLogout - Whether logout is triggered automatically
   * @returns {Promise<Object>} Logout result
   */
  const enhancedLogout = useCallback(
    async (isAutoLogout = false) => {
      if (logoutInProgress.current) {
        return;
      }

      logoutInProgress.current = true;

      try {
        const result = await auth.logout();

        if (!isAutoLogout) {
          showToast("Sesión cerrada exitosamente", "success");
        }

        return result;
      } catch (error) {
        console.warn("Error durante logout:", error);
        if (
          error.code === "EMPTY_TOKEN" ||
          error.message?.includes("No hay sesión activa")
        ) {
          return { data: { success: true }, message: "Sesión cerrada" };
        }
        throw error;
      } finally {
        setTimeout(() => {
          logoutInProgress.current = false;
        }, 1000);
      }
    },
    [auth.logout, showToast]
  );

  useEffect(() => {
    /**
     * Handles session expired events
     * @async
     * @function handleSessionExpired
     */
    const handleSessionExpired = async () => {
      if (logoutInProgress.current) {
        return;
      }

      const currentPath = window.location.pathname;
      const isLoginPage =
        currentPath === "/login" || currentPath === "/register";

      if (!isLoginPage) {
        startFullScreenLoading("Sesión expirada", "Redirigiendo al login...");

        try {
          await enhancedLogout(true);
          showToast("Tu sesión ha expirado", "warning");
        } catch (error) {
          console.error("Error durante logout automático:", error);
          showToast("Sesión expirada", "warning");
        } finally {
          setTimeout(() => {
            stopFullScreenLoading();
          }, 1000);
        }
      } else {
        try {
          await enhancedLogout(true);
        } catch (error) {
          console.warn("Error en logout silencioso:", error);
        }
      }
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, [
    enhancedLogout,
    startFullScreenLoading,
    stopFullScreenLoading,
    showToast,
  ]);

  const value = {
    ...auth,
    logout: enhancedLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext debe ser usado dentro de un AuthProvider");
  }
  return context;
};
