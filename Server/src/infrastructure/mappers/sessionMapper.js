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
   const mappedSession= new this.Session(
      {
        id: row.session_id,
        userId: row.user_id,
        refreshTokenHash: row.refresh_token_hash,
        userAgent: row.user_agent,
        ip: row.ip,
        createdAt: row.session_created_at,
        expiresAt: row.session_expires_at,
        isActive: row.is_active,
      },
      this.errorFactory
    );
    return mappedSession;
  }
}

module.exports = SessionMapper;
