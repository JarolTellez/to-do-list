const {
  SORT_ORDER,
  SESSION_SORT_FIELD,
} = require("../../infrastructure/constants/sortConstants");

class SessionService {
  constructor({
    sessionDAO,
    userService,
    sessionMapper,
    dbManager,
    erroFactory,
    validator,
    appConfig,
    paginationHelper,
  }) {
    this.dbManager = dbManager;
    this.sessionDAO = sessionDAO;
    this.userService = userService;
    this.sessionMapper = sessionMapper;
    this.erroFactory = erroFactory;
    this.validator = validator;
    this.appConfig = appConfig;
    this.paginationHelper = paginationHelper;
  }

  // async manageUserSession(
  //   { userId, existingRefreshToken, userAgent, ip },
  //   externalDbClient = null
  // ) {
  //   return this.withTransaction(async (dbClient) => {
  //     let session = null;
  //     let NewRefreshToken = null;
  //     if (existingRefreshToken) {
  //       session = await this.validateExistingSession(
  //         userId,
  //         existingRefreshToken,
  //         dbClient
  //       );
  //     }

  //     if (!session) {
  //       const { createdSession, refreshToken } = await this.createNewSession(
  //         {
  //           userId,
  //           userAgent,
  //           ip,
  //         },
  //         dbClient
  //       );
  //       session = createdSession;
  //     }

  //     await this.manageSessionLimit(
  //       userId,
  //       this.appConfig.session.maxActive,
  //       dbClient
  //     );

  //     return {
  //       refreshToken: NewRefreshToken,
  //       session,
  //     };
  //   }, externalDbClient);
  // }

  async validateExistingSession(
    userId,
    refreshTokenHash,
    externalDbClient = null
  ) {
    return this.dbManager.forRead(async (dbClient) => {
      const session = await this.sessionDAO.findByRefreshTokenHash(
        refreshTokenHash,
        dbClient
      );

      if (
        !session ||
        session.userId !== userId ||
        !session.isActive ||
        new Date() > session.expiresAt
      ) {
        return null;
      }

      return session;
    }, externalDbClient);
  }

  async createNewSession(
    { userId, refreshTokenHash, userAgent, ip },
    externalDbClient = null
  ) {
    return this.dbManager.withTransaction(async (dbClient) => {
      await this.userService.getById(userId, dbClient);
      const sessionDomain = this.sessionMapper.createRequestToDomain({
        userId: userId,
        refreshTokenHash: refreshTokenHash,
        userAgent: userAgent || "Unknown",
        ip: ip,
        expiresAt: this.appConfig.jwt.refresh.expiresIn,
        isActive: true,
      });

      const createdSession = await this.sessionDAO.create(
        sessionDomain,
        dbClient
      );
      return createdSession;
    }, externalDbClient);
  }

  async validateSession(userId, refreshTokenHash, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      const session = await this.sessionDAO.findByRefreshTokenHash(
        refreshTokenHash,
        dbClient
      );
      if (session) {
        const isValid =
          session.userId === userId &&
          session.isActive &&
          new Date(session.expiresAt) > new Date();

        if (isValid) {
          return session;
        } else {
          await this.sessionDAO.deactivate(session.id, dbClient);
          return null;
        }
      }

      return null;
    }, externalDbClient);
  }

  async validateSessionById(userId, sessionId, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      const session = await this.sessionDAO.findById(sessionId, dbClient);

      return (
        session &&
        session.userId === userId &&
        session.isActive &&
        new Date(session.expiresAt) > new Date()
      );
    }, externalDbClient);
  }

  async deactivateSession(userId, refreshTokenHash, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      const session = await this.sessionDAO.findByRefreshTokenHash(
        refreshTokenHash,
        dbClient
      );

      if (session) {
        if (session.userId !== userId) {
          throw this.errorFactory.createAuthenticationError(
            "El token no corresponde al usuario"
          );
        }
        await this.sessionDAO.deactivate(session.id, dbClient);
        return { success: true, userId: session.userId };
      }

      return { success: false };
    }, externalDbClient);
  }

  async deactivateSessionByTokenHash(
    refreshTokenHash,
    externalDbClient = null
  ) {
    return this.dbManager.withTransaction(async (dbClient) => {
      const session = await this.sessionDAO.findByRefreshTokenHash(
        refreshTokenHash,
        dbClient
      );

      if (session && session.isActive) {
        await this.sessionDAO.deactivate(session.id, dbClient);
        return { sessionId: session.id };
      }

      return { sessionId: session.id };
    }, externalDbClient);
  }

  async manageSessionLimit(userId, maxSessions = 10, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      const activeCount = await this.sessionDAO.countAllByUserIdAndIsActive(
        userId,
        true,
        dbClient
      );

      if (activeCount >= maxSessions) {
        const deactivated = await this.sessionDAO.deactivateOldestByUserId(
          userId,
          dbClient
        );

        return {
          deactivated: deactivated,
          activeCount: activeCount,
          maxSessions: maxSessions,
          hadToDeactivate: true,
        };
      }

      return {
        deactivated: false,
        activeCount: activeCount,
        maxSessions: maxSessions,
        hadToDeactivate: false,
      };
    }, externalDbClient);
  }

  async deactivateAllUserSessions(userId, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      const result = await this.sessionDAO.deactivateAllByUserId(
        userId,
        dbClient
      );

      return {
        deactivated: result,
      };
    }, externalDbClient);
  }

  async getSessionById(sessionId, externalDbClient = null) {
    this.validator.validateRequired(["sessionId"], { sessionId });

    return this.dbManager.forRead(async (dbClient) => {
      const session = await this.sessionDAO.findById(sessionId, dbClient);
      if (!session) {
        throw this.errorFactory.createNotFoundError("Sesión no encontrada", {
          attemptedData: { sessionId },
        });
      }
      return session;
    }, externalDbClient);
  }

  async deactivateSpecificSession(sessionId, externalDbClient = null) {
    this.validator.validateRequired(["sessionId"], {
      sessionId,
    });

    return this.dbManager.withTransaction(async (dbClient) => {
      const result = await this.sessionDAO.deactivate(sessionId, dbClient);

      return {
        success: result,
      };
    }, externalDbClient);
  }

  async getAllUserActiveSessions(userId, currentSessionId, options = {}) {
    this.validator.validateRequired(["userId"], { userId });
    const {
      page = 1,
      limit = 10,
      offset = 0,
      externalDbClient = null,
    } = options;

    return this.dbManager.forRead(async (dbClient) => {
      // get paginated sessions
      const sessions = await this.sessionDAO.findAllByUserIdAndIsActive({
        userId: userId,
        active: true,
        limit,
        offset,
        sortBy: SESSION_SORT_FIELD.CREATED_AT,
        sortOrder: SORT_ORDER.DESC,
        externalDbClient: dbClient,
      });

      // get total sessions
      const total = await this.sessionDAO.countAllByUserIdAndIsActive(
        userId,
        true,
        dbClient
      );
      const totalPages = this.paginationHelper.calculateTotalPages(
        total,
        limit
      );

      const sessionsResponse = sessions.map((session) =>
        this.sessionMapper.domainToResponse(session, currentSessionId)
      );

      const response = this.paginationHelper.buildPaginationResponse(
        sessionsResponse,
        { page, limit, maxLimit: 50 },
        total,
        totalPages,
        "sessions"
      );
      return response;
    }, externalDbClient);
  }
}

module.exports = SessionService;
