class SessionMapper {
  constructor({
    Session,
    SessionResponseDTO,
    CreateSessionRequestDTO,
    RefreshSessionRequestDTO,
    errorFactory,
  }) {
    this.Session = Session;
    this.SessionResponseDTO = SessionResponseDTO;
    this.CreateSessionRequestDTO = CreateSessionRequestDTO;
    this.RefreshSessionRequestDTO = RefreshSessionRequestDTO;
    this.errorFactory = errorFactory;
  }

  domainToResponse(sessionDomain, currentSessionId = null) {
    let isCurrent = null;

    if (currentSessionId && sessionDomain.id) {
      isCurrent = sessionDomain.id === currentSessionId;
    }

    return new this.SessionResponseDTO({
      id: sessionDomain.id,
      userId: sessionDomain.userId,
      userAgent: sessionDomain.userAgent,
      ip: sessionDomain.ip,
      createdAt: sessionDomain.createdAt,
      expiresAt: sessionDomain.expiresAt,
      isActive: sessionDomain.isActive,
      isCurrent: isCurrent || false,
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
        refreshTokenHash: createSessionRequest.refreshTokenHash,
        userAgent: createSessionRequest.userAgent,
        ip: createSessionRequest.ip,
        expiresAt: createSessionRequest.expiresIn,
        isActive:
          createSessionRequest.isActive !== undefined
            ? createSessionRequest.isActive
            : true,
      },
      this.errorFactory
    );
  }

  refreshRequestToDomain(refreshSessionRequest, existingSession) {
    return this.Session.create(
      {
        userId: existingSession.userId,
        refreshTokenHash: refreshSessionRequest.refreshTokenHash,
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
    const mappedSession = new this.Session(
      {
        id: row.id,
        userId: row.userId,
        refreshTokenHash: row.refreshTokenHash,
        userAgent: row.userAgent,
        ip: row.ip,
        createdAt: row.createdAt,
        expiresAt: row.expiresAt,
        isActive: row.isActive,
      },
      this.errorFactory
    );
    return mappedSession;
  }
}

module.exports = SessionMapper;
