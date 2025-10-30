import React, { createContext, useContext, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const auth = useAuth();

  const enhancedLogout = useCallback(async () => {
    try {
      const result = await auth.logout();
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
    }
  }, [auth.logout]);

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
