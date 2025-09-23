class CreateSessionRequestDTO {
  constructor({ userId, refreshToken, deviceId, userAgent, ip, expiresInHours }) {
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