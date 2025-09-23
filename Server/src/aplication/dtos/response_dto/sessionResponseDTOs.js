class SessionResponseDTO {
  constructor({
    id,
    userId,
    deviceId,
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
    this.deviceId = deviceId;
    this.userAgent = userAgent;
    this.ip = ip;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
    this.isActive = isActive;
    this.isExpired = isExpired;
    this.timeUntilExpiration = timeUntilExpiration;
  }
}