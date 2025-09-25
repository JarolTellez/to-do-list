class CreateSessionRequestDTO {
  constructor({ userId, refreshToken, userAgent, ip, expiresInHours = 24 * 7 }) {
    this.userId = userId;
    this.refreshToken = refreshToken;
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

module.exports ={
  CreateSessionRequestDTO,
  RefreshSessionRequestDTO
}