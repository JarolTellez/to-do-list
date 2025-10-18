import { api } from "./api/clients/apiClient.js";
import { sessionMappers } from "../mappers/sessionMapper.js";

export async function getUserSessions() {
  try {
    const data = await api.get("/auth/active-sessions");

    if (data.success === false) {
      return { success: false, error: data.message };
    }
    const sessions = data.data.sessions?.map(sessionMappers.apiToSession) || [];
    return { success: true, sessions };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Error de conexión",
    };
  }
}

export async function closeAllSessions() {
  try {
    const data = await api.patch("/auth/close-all-sessions");

    if (data.success === false) {
      return { success: false, error: data.message };
    }
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Error de conexión",
    };
  }
}

export async function closeSession(sessionId) {
  try {
    const data = await api.delete(`/auth/session/${sessionId}`);

    if (data.success === false) {
      return { success: false, error: data.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Error de conexión",
    };
  }
}
