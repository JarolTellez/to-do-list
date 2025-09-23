class SessionMapper {
  constructor(Session, SessionResponseDTO, errorFactory) {
    this.Session = Session;
    this.SessionResponseDTO = SessionResponseDTO;
    this.errorFactory = errorFactory;
  }

  domainToResponse(sessionDomain) {
    return new this.SessionResponseDTO({
      id: sessionDomain.id,
      userId: sessionDomain.userId,
      deviceId: sessionDomain.deviceId,
      userAgent: sessionDomain.userAgent,
      ip: sessionDomain.ip,
      createdAt: sessionDomain.createdAt,
      expiresAt: sessionDomain.expiresAt,
      isActive: sessionDomain.isActive,
    });
  }

  requestToDomain(sessionRequest) {
    return this.Session.create({
      userId: sessionRequest.userId,
      refreshToken: sessionRequest.refreshToken,
      deviceId: sessionRequest.deviceId,
      userAgent: sessionRequest.userAgent,
      ip: sessionRequest.ip,
      expiresInHours: sessionRequest.expiresInHours,
    }, this.errorFactory);
  }

  dbToDomain(row) {
    if (!row) {
      return null;
    }
    return new this.Session({
      id: row.id,
      userId: row.user_id,
      refreshTokenHash: row.refresh_token_hash,
      deviceId: row.device_id,
      userAgent: row.user_agent,
      ip: row.ip,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      isActive: row.is_active,
    },this.errorFactory);
  }
}

module.exports = SessionMapper;
