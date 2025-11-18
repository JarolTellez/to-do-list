import { apiClient } from "./api/clients/apiClient.js";
import { sessionMappers } from "../mappers/sessionMapper.js";
import { PaginationValidator } from "../utils/validators/paginationValidator.js";

/**
 * Retrieves paginated list of user's active sessions
 * @async
 * @function getUserSessions
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of items per page
 * @returns {Promise<Object>} Paginated sessions data
 */
export async function getUserSessions(page, limit) {
  const validated = PaginationValidator.validateParams("SESSIONS", page, limit);
  const response = await apiClient.api.get("/auth/active-sessions", {
    params: {
      page: validated.page,
      limit: validated.limit,
    },
  });

  const sessions =
    response.data.sessions?.map(sessionMappers.apiToSession) || [];
  return {
    data: sessions,
    message: response.message,
    pagination: response.data.pagination,
  };
}

/**
 * Closes all active sessions except current one
 * @async
 * @function closeAllSessions
 * @returns {Promise<Object>} Operation result
 */
export async function closeAllSessions() {
  const response = await apiClient.api.patch("/auth/close-all-sessions");
  return { data: response.data, message: response.message };
}

/**
 * Closes specific session by ID
 * @async
 * @function closeSession
 * @param {string} sessionId - Session identifier to close
 * @returns {Promise<Object>} Operation result
 */
export async function closeSession(sessionId) {
  const response = await apiClient.api.delete(`/auth/session/${sessionId}`);
  return { data: response.data, message: response.message };
}
