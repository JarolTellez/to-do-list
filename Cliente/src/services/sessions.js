import { apiClient } from "./api/clients/apiClient.js";
import { sessionMappers } from "../mappers/sessionMapper.js";

export async function getUserSessions() {
  try {
    const response = await apiClient.api.get("/auth/active-sessions");

    const sessions =
      response.data.sessions?.map(sessionMappers.apiToSession) || [];
    return { data: sessions, message: response.message };
  } catch (error) {
    console.error("Error getting user sessions:", error);
    throw error;
  }
}

export async function closeAllSessions() {
  try {
    const response = await apiClient.api.patch("/auth/close-all-sessions");

    return { data: response.data, message: response.message };
  } catch (error) {
     console.error("Error closing all sessions:", error);
    throw error;
  }
}

export async function closeSession(sessionId) {
  try {
    const response = await apiClient.api.delete(`/auth/session/${sessionId}`);

    return { data: response.data, message: response.message };
  } catch (error) {
     console.error("Error clossing session:", error);
    throw error;
  }
}
