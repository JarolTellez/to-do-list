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
    timeUntilExpiration
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
  }
}

module.exports=SessionResponseDTO
