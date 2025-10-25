import { apiClient } from "./api/clients/apiClient.js";
import { sessionMappers } from "../mappers/sessionMapper.js";

export async function getUserSessions() {
  const response = await apiClient.api.get("/auth/active-sessions", {
    page: 1,
    limit: 2,
  });

  const sessions =
    response.data.sessions?.map(sessionMappers.apiToSession) || [];
  return { data: sessions, message: response.message };
}

export async function closeAllSessions() {
  const response = await apiClient.api.patch("/auth/close-all-sessions");
  return { data: response.data, message: response.message };
}

export async function closeSession(sessionId) {
  const response = await apiClient.api.delete(`/auth/session/${sessionId}`);
  return { data: response.data, message: response.message };
}
