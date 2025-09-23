class CreateSessionRequestDTO {
  constructor({ userId, refreshToken, deviceId = null, userAgent, ip, expiresInHours = 24 * 7 }) {
    this.userId = userId;
    this.refreshToken = refreshToken;
    this.deviceId = deviceId;
    this.userAgent = userAgent;
    this.ip = ip;
    this.expiresInHours = expiresInHours;
  }
}

class RefreshSessionRequestDTO {
    constructor({ refreshToken }) {
        this.refreshToken = refreshToken;
    }
}