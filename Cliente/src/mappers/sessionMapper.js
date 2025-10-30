import { Session } from '../models/session.js';

export const sessionMappers = {

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
      isCurrent: apiData.isCurrent
    });
  }
};