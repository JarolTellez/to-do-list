import { Session } from "../models/session.js";
/**
 * Session data transformation utilities
 * @namespace sessionMappers
 * @description Provides mapping functions for session data between API and domain models
 */

export const sessionMappers = {
  /**
   * Transforms API session data to domain model
   * @function apiToSession
   * @param {Object} apiData - Raw API session data
   * @returns {Session} Domain session object
   */
  apiToSession: (apiData) => {
    return new Session({
      id: apiData.id,
      userId: apiData.userId,
      userAgent: apiData.userAgent,
      ip: apiData.ip,
      createdAt: apiData.createdAt,
      expiresAt: apiData.expiresAt,
      isActive: apiData.isActive,
      isExpired: apiData.isExpired,
      timeUntilExpiration: apiData.timeUntilExpiration,
      isCurrent: apiData.isCurrent,
    });
  },
};
