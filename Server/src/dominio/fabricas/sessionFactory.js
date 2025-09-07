class SessionFactory{
    constructor(Session){
        this.Session = Session;
    }

    crear(userId, refreshTokenHash, userAgent, ip, deviceId, isActive) {
    const createdAt = new Date();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    return new this.Session({
      idRefreshToken: null,
      userId,
      refreshTokenHash,
      deviceId,
      userAgent,
      ip,
      createdAt,
      expiresAt,
      isActive: isActive
    });
  }
}

module.exports = SessionFactory;