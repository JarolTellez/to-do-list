class SessionMapper {
  constructor({
    Session,
    SessionResponseDTO,
    CreateSessionRequestDTO,
    RefreshSessionRequestDTO,
    errorFactory}
  ) {
    this.Session = Session;
    this.SessionResponseDTO = SessionResponseDTO;
    this.CreateSessionRequestDTO = CreateSessionRequestDTO;
    this.RefreshSessionRequestDTO = RefreshSessionRequestDTO;
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

  requestDataToCreateDTO(requestData) {
    return new this.CreateSessionRequestDTO(requestData);
  }

  requestDataToRefreshDTO(requestData) {
    return new this.RefreshSessionRequestDTO(requestData);
  }

  createRequestToDomain(createSessionRequest) {
    return this.Session.create(
      {
        userId: createSessionRequest.userId,
        refreshToken: createSessionRequest.refreshToken,
        deviceId: createSessionRequest.deviceId,
        userAgent: createSessionRequest.userAgent,
        ip: createSessionRequest.ip,
        expiresInHours: createSessionRequest.expiresInHours,
      },
      this.errorFactory
    );
  }

  refreshRequestToDomain(refreshSessionRequest, existingSession) {
    return this.Session.create(
      {
        userId: existingSession.userId,
        refreshToken: refreshSessionRequest.refreshToken,
        deviceId: existingSession.deviceId,
        userAgent: existingSession.userAgent,
        ip: existingSession.ip,
        expiresInHours: 24 * 7,
      },
      this.errorFactory
    );
  }

  dbToDomain(row) {
    if (!row) {
      return null;
    }
    return new this.Session(
      {
        id: row.id,
        userId: row.user_id,
        refreshTokenHash: row.refresh_token_hash,
        deviceId: row.device_id,
        userAgent: row.user_agent,
        ip: row.ip,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        isActive: row.is_active,
      },
      this.errorFactory
    );
  }
}

module.exports = SessionMapper;
