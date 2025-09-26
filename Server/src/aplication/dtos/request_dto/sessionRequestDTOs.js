class CreateSessionRequestDTO {
  constructor({ userId, refreshToken, userAgent, ip, expiresIn = "7d" }) {
    this.userId = userId;
    this.refreshToken = refreshToken;
    this.userAgent = userAgent;
    this.ip = ip;
    this.expiresIn = expiresIn;
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