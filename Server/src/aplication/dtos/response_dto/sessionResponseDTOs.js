class SessionResponseDTO {
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
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
    this.isActive = isActive;
    this.isExpired = isExpired;
    this.timeUntilExpiration = timeUntilExpiration;
    this.isCurrent = isCurrent;
  }
}

module.exports = SessionResponseDTO;
