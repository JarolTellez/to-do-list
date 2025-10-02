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
  //   transactionClient = null
  // ) {
  //   return this.withTransaction(async (tx) => {
  //     let session = null;
  //     let NewRefreshToken = null;
  //     if (existingRefreshToken) {
  //       session = await this.validateExistingSession(
  //         userId,
  //         existingRefreshToken,
  //         tx
  //       );
  //     }

  //     if (!session) {
  //       const { createdSession, refreshToken } = await this.createNewSession(
  //         {
  //           userId,
  //           userAgent,
  //           ip,
  //         },
  //         tx
  //       );
  //       session = createdSession;
  //     }

  //     await this.manageSessionLimit(
  //       userId,
  //       this.appConfig.session.maxActive,
  //       tx
  //     );

  //     return {
  //       refreshToken: NewRefreshToken,
  //       session,
  //     };
  //   }, transactionClient);
  // }

  async validateExistingSession(
    userId,
    refreshTokenHash,
    transactionClient = null
  ) {
    try {
      const session = await this.sessionDAO.findByRefreshTokenHash(
        refreshTokenHash,
        transactionClient
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
    transactionClient = null
  ) {
    return this.dbManager.withTransaction(async (tx) => {
      const sessionDomain = this.sessionMapper.createRequestToDomain({
        userId: userId,
        refreshTokenHash: refreshTokenHash,
        userAgent: userAgent || "Unknown",
        ip: ip,
        expiresAt: this.appConfig.jwt.refresh.expiresIn,
        isActive: true,
      });

      const createdSession = await this.sessionDAO.create(sessionDomain, tx);
      return createdSession;
    }, transactionClient);
  }

  async validateSession(userId, refreshTokenHash, transactionClient = null) {
    return this.dbManager.withTransaction(async (tx) => {
      const session = await this.sessionDAO.findByRefreshTokenHash(
        refreshTokenHash,
        tx
      );
      if (session) {
        const isValid =
          session.userId === userId &&
          session.isActive &&
          new Date(session.expiresAt) > new Date();

        if (isValid) {
          return session;
        } else {
          await this.sessionDAO.deactivate(session.id, tx);
          return null;
        }
      }

      return null;
    }, transactionClient);
  }

  async validateSessionById(userId, sessionId, tx = null) {
    const session = await this.sessionDAO.findById(sessionId, tx);

    return (
      session &&
      session.userId === userId &&
      session.isActive &&
      new Date(session.expiresAt) > new Date()
    );
  }

  async deactivateSession(userId, refreshTokenHash, transactionClient = null) {
    return this.dbManager.withTransaction(async (tx) => {
      const session = await this.sessionDAO.findByRefreshTokenHash(
        refreshTokenHash,
        tx
      );

      if (session) {
        if (session.userId !== userId) {
          throw this.errorFactory.createAuthenticationError(
            "El token no corresponde al usuario"
          );
        }
        await this.sessionDAO.deactivate(session.id, tx);
        return { success: true, userId: session.userId };
      }

      return { success: false };
    }, transactionClient);
  }

  async deactivateSessionByTokenHash(
    refreshTokenHash,
    transactionClient = null
  ) {
    return this.dbManager.withTransaction(async (tx) => {
      const session = await this.sessionDAO.findByRefreshTokenHash(
        refreshTokenHash,
        tx
      );

      if (session && session.isActive) {
        await this.sessionDAO.deactivate(session.id, tx);
        return { sessionId: session.id };
      }

      return { sessionId: session.id };
    }, transactionClient);
  }

  async manageSessionLimit(userId, maxSessions = 10, transactionClient = null) {
    return this.dbManager.withTransaction(async (tx) => {
      const activeCount = await this.sessionDAO.countAllByUserIdAndIsActive(
        userId,
        true,
        tx
      );

      if (activeCount >= maxSessions) {
        const deactivated = await this.sessionDAO.deactivateOldestByUserId(
          userId,
          tx
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
    }, transactionClient);
  }

  async deactivateAllUserSessions(userId, transactionClient = null) {
    return this.dbManager.withTransaction(async (tx) => {
      const result = await this.sessionDAO.deactivateAllByUserId(userId, tx);

      return {
        deactivated: result,
      };
    }, transactionClient);
  }

  async findSessionById(sessionId, tx = null) {
    this.validator.validateRequired(["sessionId"], { sessionId });

    return await this.sessionDAO.findById(sessionId, tx);
  }

  async deactivateSpecificSession(sessionId, tx = null) {
    this.validator.validateRequired(["sessionId"], {
      sessionId,
    });

    const result = await this.sessionDAO.deactivate(sessionId, tx);

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
