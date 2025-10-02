const {
  SORT_ORDER,
  SESSION_SORT_FIELD,
} = require("../../infrastructure/constants/sortConstants");

class SessionService {
  constructor({
    sessionDAO,
    sessionMapper,
    dbManager,
    erroFactory,
    validator,
    appConfig,
    paginationHelper,
  }) {
    this.dbManager = dbManager;
    this.sessionDAO = sessionDAO;
    this.sessionMapper = sessionMapper;
    this.erroFactory = erroFactory;
    this.validator = validator;
    this.appConfig = appConfig;
    this.paginationHelper = paginationHelper;
  }

  // async manageUserSession(
  //   { userId, existingRefreshToken, userAgent, ip },
  //   transactionDbClient = null
  // ) {
  //   return this.withTransaction(async (externalTransactionDbClient) => {
  //     let session = null;
  //     let NewRefreshToken = null;
  //     if (existingRefreshToken) {
  //       session = await this.validateExistingSession(
  //         userId,
  //         existingRefreshToken,
  //         externalTransactionDbClient
  //       );
  //     }

  //     if (!session) {
  //       const { createdSession, refreshToken } = await this.createNewSession(
  //         {
  //           userId,
  //           userAgent,
  //           ip,
  //         },
  //         externalTransactionDbClient
  //       );
  //       session = createdSession;
  //     }

  //     await this.manageSessionLimit(
  //       userId,
  //       this.appConfig.session.maxActive,
  //       externalTransactionDbClient
  //     );

  //     return {
  //       refreshToken: NewRefreshToken,
  //       session,
  //     };
  //   }, transactionDbClient);
  // }

  async validateExistingSession(
    userId,
    refreshTokenHash,
    transactionDbClient = null
  ) {
    try {
      const session = await this.sessionDAO.findByRefreshTokenHash(
        refreshTokenHash,
        transactionDbClient
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
    } catch (error) {
      throw error;
    }
  }

  async createNewSession(
    { userId, refreshTokenHash, userAgent, ip },
    transactionDbClient = null
  ) {
    return this.dbManager.withTransaction(async (externalTransactionDbClient) => {
      const sessionDomain = this.sessionMapper.createRequestToDomain({
        userId: userId,
        refreshTokenHash: refreshTokenHash,
        userAgent: userAgent || "Unknown",
        ip: ip,
        expiresAt: this.appConfig.jwt.refresh.expiresIn,
        isActive: true,
      });

      const createdSession = await this.sessionDAO.create(sessionDomain, externalTransactionDbClient);
      return createdSession;
    }, transactionDbClient);
  }

  async validateSession(userId, refreshTokenHash, transactionDbClient = null) {
    return this.dbManager.withTransaction(async (externalTransactionDbClient) => {
      const session = await this.sessionDAO.findByRefreshTokenHash(
        refreshTokenHash,
        externalTransactionDbClient
      );
      if (session) {
        const isValid =
          session.userId === userId &&
          session.isActive &&
          new Date(session.expiresAt) > new Date();

        if (isValid) {
          return session;
        } else {
          await this.sessionDAO.deactivate(session.id, externalTransactionDbClient);
          return null;
        }
      }

      return null;
    }, transactionDbClient);
  }

  async validateSessionById(userId, sessionId, externalTransactionDbClient = null) {
    const session = await this.sessionDAO.findById(sessionId, externalTransactionDbClient);

    return (
      session &&
      session.userId === userId &&
      session.isActive &&
      new Date(session.expiresAt) > new Date()
    );
  }

  async deactivateSession(userId, refreshTokenHash, transactionDbClient = null) {
    return this.dbManager.withTransaction(async (externalTransactionDbClient) => {
      const session = await this.sessionDAO.findByRefreshTokenHash(
        refreshTokenHash,
        externalTransactionDbClient
      );

      if (session) {
        if (session.userId !== userId) {
          throw this.errorFactory.createAuthenticationError(
            "El token no corresponde al usuario"
          );
        }
        await this.sessionDAO.deactivate(session.id, externalTransactionDbClient);
        return { success: true, userId: session.userId };
      }

      return { success: false };
    }, transactionDbClient);
  }

  async deactivateSessionByTokenHash(
    refreshTokenHash,
    transactionDbClient = null
  ) {
    return this.dbManager.withTransaction(async (externalTransactionDbClient) => {
      const session = await this.sessionDAO.findByRefreshTokenHash(
        refreshTokenHash,
        externalTransactionDbClient
      );

      if (session && session.isActive) {
        await this.sessionDAO.deactivate(session.id, externalTransactionDbClient);
        return { sessionId: session.id };
      }

      return { sessionId: session.id };
    }, transactionDbClient);
  }

  async manageSessionLimit(userId, maxSessions = 10, transactionDbClient = null) {
    return this.dbManager.withTransaction(async (externalTransactionDbClient) => {
      const activeCount = await this.sessionDAO.countAllByUserIdAndIsActive(
        userId,
        true,
        externalTransactionDbClient
      );

      if (activeCount >= maxSessions) {
        const deactivated = await this.sessionDAO.deactivateOldestByUserId(
          userId,
          externalTransactionDbClient
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
    }, transactionDbClient);
  }

  async deactivateAllUserSessions(userId, transactionDbClient = null) {
    return this.dbManager.withTransaction(async (externalTransactionDbClient) => {
      const result = await this.sessionDAO.deactivateAllByUserId(userId, externalTransactionDbClient);

      return {
        deactivated: result,
      };
    }, transactionDbClient);
  }

  async findSessionById(sessionId, externalTransactionDbClient = null) {
    this.validator.validateRequired(["sessionId"], { sessionId });

    return await this.sessionDAO.findById(sessionId, externalTransactionDbClient);
  }

  async deactivateSpecificSession(sessionId, externalTransactionDbClient = null) {
    this.validator.validateRequired(["sessionId"], {
      sessionId,
    });

    const result = await this.sessionDAO.deactivate(sessionId, externalTransactionDbClient);

    return {
      success: result,
    };
  }

  async findAllUserActiveSessions(userId, currentSessionId, options = {}) {
    this.validator.validateRequired(["userId"], { userId });
    const { page = 1, limit = 10, offset = 0, dbClient = null } = options;

    return this.dbManager.forRead(async (internalClient) => {
      const clientToUse = dbClient || internalClient;
      // get paginated sessions
      const sessions = await this.sessionDAO.findAllByUserIdAndIsActive({
        userId: userId,
        active: true,
        limit,
        offset,
        sortBy: SESSION_SORT_FIELD.CREATED_AT,
        sortOrder: SORT_ORDER.DESC,
        externalDbClient: clientToUse,
      });

      // get total sessions
      const total = await this.sessionDAO.countAllByUserIdAndIsActive({
        userId,
        active: true,
        externalDbClient: clientToUse,
      });

      const sessionsResponse = sessions.map((session) =>
        this.sessionMapper.domainToResponse(session, currentSessionId)
      );

      const response = this.paginationHelper.buildPaginationResponse(
        sessionsResponse,
        { page, limit, maxLimit: 50 },
        total,
        "sessionsResponse"
      );
      return response;
    }, dbClient);
  }
}

module.exports = SessionService;
