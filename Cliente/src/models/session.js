/**
 * Session domain model
 * @class Session
 * @description Represents a user session with expiration
 */
export class Session {
  /**
   * Creates a new Session instance
   * @constructor
   * @param {Object} params - Session parameters
   * @param {string} params.id - Session identifier
   * @param {string} params.userId - User identifier
   * @param {string} params.userAgent - Client user agent string
   * @param {string} params.ip - Client IP address
   * @param {string} params.createdAt - Session creation timestamp
   * @param {string} params.expiresAt - Session expiration timestamp
   * @param {boolean} params.isActive - Whether session is active
   * @param {boolean} params.isExpired - Whether session is expired
   * @param {string} params.timeUntilExpiration - Time until expiration
   * @param {boolean} params.isCurrent - Whether this is the current session
   */
  constructor({
    id,
    userId,
    userAgent,
    ip,
    createdAt,
    expiresAt,
    isActive,
    isExpired,
    timeUntilExpiration,
    isCurrent,
  }) {
    this.id = id;
    this.userId = userId;
    this.userAgent = userAgent;
    this.ip = ip;
    this.createdAt = new Date(createdAt);
    this.expiresAt = new Date(expiresAt);
    this.isActive = isActive;
    this.isExpired = isExpired;
    this.timeUntilExpiration = timeUntilExpiration;
    this.isCurrent = isCurrent;
  }
}
