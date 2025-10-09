/**
 * Mapper for Session entity transformations between layers
 * @class SessionMapper
 */
class SessionMapper {
  /**
   * Creates a new SessionMapper instance
   * @param {Object} dependencies - Dependencies for SessionMapper
   * @param {class} dependencies.Session - Session domain class
   * @param {class} dependencies.SessionResponseDTO - Session response DTO class
   * @param {class} dependencies.CreateSessionRequestDTO - Create session request DTO class
   * @param {class} dependencies.RefreshSessionRequestDTO - Refresh session request DTO class
   * @param {Object} dependencies.errorFactory - Error factory instance
   */
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

  /**
   * Converts Session domain entity to response DTO
   * @param {Session} sessionDomain - Session domain entity
   * @param {number} [currentSessionId=null] - Current session ID for comparison
   * @returns {SessionResponseDTO} Session response DTO
   */
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

  /**
   * Converts request data to create session DTO
   * @param {Object} requestData - Raw request data
   * @returns {CreateSessionRequestDTO} Create session request DTO
   */
  requestDataToCreateDTO(requestData) {
    return new this.CreateSessionRequestDTO(requestData);
  }

  /**
   * Converts request data to refresh session DTO
   * @param {Object} requestData - Raw request data
   * @returns {RefreshSessionRequestDTO} Refresh session request DTO
   */
  requestDataToRefreshDTO(requestData) {
    return new this.RefreshSessionRequestDTO(requestData);
  }

  /**
   * Converts create session request DTO to Session domain entity
   * @param {CreateSessionRequestDTO} createSessionRequest - Create session request DTO
   * @returns {Session} Session domain entity
   */
  createRequestToDomain(createSessionRequest) {
    return this.Session.create({
      userId: createSessionRequest.userId,
      refreshTokenHash: createSessionRequest.refreshTokenHash,
      userAgent: createSessionRequest.userAgent,
      ip: createSessionRequest.ip,
      expiresAt: createSessionRequest.expiresIn,
      isActive:
        createSessionRequest.isActive !== undefined
          ? createSessionRequest.isActive
          : true,
    });
  }

  /**
   * Converts refresh session request DTO to Session domain entity
   * @param {RefreshSessionRequestDTO} refreshSessionRequest - Refresh session request DTO
   * @param {Session} existingSession - Existing session domain entity
   * @returns {Session} Refreshed Session domain entity
   */
  refreshRequestToDomain(refreshSessionRequest, existingSession) {
    return this.Session.create({
      userId: existingSession.userId,
      refreshTokenHash: refreshSessionRequest.refreshTokenHash,
      userAgent: existingSession.userAgent,
      ip: existingSession.ip,
      expiresInHours: 24 * 7,
    });
  }

  /**
   * Converts database row to Session domain entity
   * @param {Object} row - Database row
   * @returns {Session|null} Session domain entity or null
   */
  dbToDomain(row) {
    if (!row) {
      return null;
    }
    const mappedSession = new this.Session({
      id: row.id,
      userId: row.userId,
      refreshTokenHash: row.refreshTokenHash,
      userAgent: row.userAgent,
      ip: row.ip,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      isActive: row.isActive,
    });
    return mappedSession;
  }
}

module.exports = SessionMapper;
