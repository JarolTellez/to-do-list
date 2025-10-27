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
    errorFactory,
    validator,
    sortValidator,
    appConfig,
    paginationHelper,
    paginationConfig,
    errorMapper,
  }) {
    this.dbManager = dbManager;
    this.sessionDAO = sessionDAO;
    this.userService = userService;
    this.sessionMapper = sessionMapper;
    this.errorFactory = errorFactory;
    this.validator = validator;
    this.sortValidator = sortValidator;
    this.appConfig = appConfig;
    this.paginationHelper = paginationHelper;
    this.paginationConfig = paginationConfig;
    this.errorMapper = errorMapper;
  }

  async validateExistingSession(
    userId,
    refreshTokenHash,
    externalDbClient = null
  ) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["userId", "refreshTokenHash"], {
        userId,
        refreshTokenHash,
      });
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
    });
  }

  async createNewSession(
    { userId, refreshTokenHash, userAgent, ip },
    externalDbClient = null
  ) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(
        ["userId", "refreshTokenHash", "userAgent", "ip"],
        { userId, refreshTokenHash, userAgent, ip }
      );
      return this.dbManager.withTransaction(async (dbClient) => {
        await this.userService.validateUserExistenceById(userId, dbClient);
        const sessionDomain = this.sessionMapper.createRequestToDomain({
          userId: userId,
          refreshTokenHash: refreshTokenHash,
          userAgent: userAgent,
          ip: ip,
          expiresAt: this.appConfig.jwt.refresh.expiresIn,
          isActive: true,
        });

        const createdSession = await this.sessionDAO.create(
          sessionDomain,
          dbClient
        );
        if (!createdSession) {
          throw this.errorFactory.createDatabaseError(
            "Error al crear la sesión en la base de datos",
            {
              userId: userId,
              operation: "createNewSession",
            }
          );
        }

        return createdSession;
      }, externalDbClient);
    });
  }

  async validateSession(userId, refreshTokenHash, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["userId", "refreshTokenHash"], {
        userId,
        refreshTokenHash,
      });
      return this.dbManager.withTransaction(async (dbClient) => {
        const session = await this.sessionDAO.findByRefreshTokenHash(
          refreshTokenHash,
          dbClient
        );
        if (!session) {
          throw this.errorFactory.createAuthenticationError(
            "Sesión no encontrada",
            {
              userId: userId,
              operation: "validateSession",
            }
          );
        }

        const isValid =
          session.userId === userId &&
          session.isActive &&
          new Date(session.expiresAt) > new Date();

        if (isValid) {
          return session;
        } else {
          await this.sessionDAO.deactivate(session.id, dbClient);
          throw this.errorFactory.createAuthenticationError(
            "Sesión inválida o expirada",
            {
              sessionId: session.id,
              userId: userId,
              isActive: session.isActive,
              isExpired: new Date(session.expiresAt) <= new Date(),
              operation: "validateSession",
            }
          );
        }
      }, externalDbClient);
    });
  }

  async validateSessionById(userId, sessionId, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["userId", "sessionId"], {
        userId,
        sessionId,
      });

      return this.dbManager.forRead(async (dbClient) => {
        const session = await this.sessionDAO.findById(sessionId, dbClient);

        if (!session) {
          throw this.errorFactory.createNotFoundError("Sesión no encontrada", {
            sessionId: sessionId,
            userId: userId,
            operation: "validateSessionById",
          });
        }

        const isValid =
          session.userId === userId &&
          session.isActive &&
          new Date(session.expiresAt) > new Date();

        if (!isValid) {
          throw this.errorFactory.createAuthenticationError(
            "Sesión inválida o expirada",
            {
              sessionId: sessionId,
              userId: userId,
              isActive: session.isActive,
              isExpired: new Date(session.expiresAt) <= new Date(),
              operation: "validateSessionById",
            }
          );
        }
        return session;
      }, externalDbClient);
    });
  }

  async deactivateSession(userId, refreshTokenHash, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["userId", "refreshTokenHash"], {
        userId,
        refreshTokenHash,
      });
      return this.dbManager.withTransaction(async (dbClient) => {
        const session = await this.sessionDAO.findByRefreshTokenHash(
          refreshTokenHash,
          dbClient
        );

        if (!session) {
          throw this.errorFactory.createNotFoundError("Sesión no encontrada", {
            userId: userId,
            operation: "deactivateSession",
          });
        }

        if (session.userId !== userId) {
          throw this.errorFactory.createForbiddenError(
            "No tienes permisos para desactivar esta sesión",
            {
              attemptingUserId: userId,
              sessionUserId: session.userId,
              sessionId: session.id,
              operation: "deactivateSession",
            }
          );
        }
        const result = await this.sessionDAO.deactivate(session.id, dbClient);

        if (!result) {
          throw this.errorFactory.createDatabaseError(
            "Error al desactivar la sesión en la base de datos",
            {
              sessionId: session.id,
              userId: userId,
              operation: "deactivateSession",
            }
          );
        }

        return {
          success: true,
          userId: session.userId,
          sessionId: session.id,
        };
      }, externalDbClient);
    });
  }

  async deactivateSessionByTokenHash(
    refreshTokenHash,
    externalDbClient = null
  ) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["refreshTokenHash"], {
        refreshTokenHash,
      });
      return this.dbManager.withTransaction(async (dbClient) => {
        const session = await this.sessionDAO.findByRefreshTokenHash(
          refreshTokenHash,
          dbClient
        );

        if (!session) {
          throw this.errorFactory.createNotFoundError("Sesión no encontrada", {
            operation: "deactivateSessionByTokenHash",
          });
        }

        if (session.isActive) {
          const result = await this.sessionDAO.deactivate(session.id, dbClient);

          if (!result) {
            throw this.errorFactory.createDatabaseError(
              "Error al desactivar la sesión en la base de datos",
              {
                sessionId: session.id,
                userId: session.userId,
                operation: "deactivateSessionByTokenHash",
              }
            );
          }
        }

        return {
          sessionId: session.id,
          userId: session.userId,
          wasActive: session.isActive,
        };
      }, externalDbClient);
    });
  }

  async manageSessionLimit(userId, maxSessions = 10, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["userId"], { userId });
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
            activeCount: activeCount - deactivated,
            maxSessions: maxSessions,
            hadToDeactivate: true,
          };
        }

        return {
          deactivated: 0,
          activeCount: activeCount,
          maxSessions: maxSessions,
          hadToDeactivate: false,
        };
      }, externalDbClient);
    });
  }

  async deactivateAllUserSessions(userId, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      return this.dbManager.withTransaction(async (dbClient) => {
        const result = await this.sessionDAO.deactivateAllByUserId(
          userId,
          dbClient
        );

        return {
          deactivated: result,
        };
      }, externalDbClient);
    });
  }

  async getSessionById(sessionId, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["sessionId"], { sessionId });

      return this.dbManager.forRead(async (dbClient) => {
        const session = await this.sessionDAO.findById(sessionId, dbClient);
        if (!session) {
          throw this.errorFactory.createNotFoundError("Sesión no encontrada", {
            sessionId: sessionId,
            operation: "getSessionById",
          });
        }
        return session;
      }, externalDbClient);
    });
  }

  async deactivateSpecificSession(sessionId, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["sessionId"], {
        sessionId,
      });

      return this.dbManager.withTransaction(async (dbClient) => {
        const result = await this.sessionDAO.deactivate(sessionId, dbClient);

        if (!result) {
          throw this.errorFactory.createDatabaseError(
            "Error al desactivar la sessión en la base de datos",
            {
              sessionId: sessionId,
              operation: "deactivateSpecificSession",
            }
          );
        }
        return {
          success: result,
        };
      }, externalDbClient);
    });
  }

  async getAllUserActiveSessions(
    userId,
    currentSessionId,
    options = {},
    externalDbClient = null
  ) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["userId"], { userId });
      const {
        page = this.paginationConfig.DEFAULT_PAGE,
        limit = this.paginationConfig.DEFAULT_LIMIT,
        sortBy,
        sortOrder,
      } = options;

      const validatedSort = this.sortValidator.validateAndNormalizeSortParams(
        "SESSION",
        { sortBy, sortOrder }
      );
      const pagination = this.paginationHelper.calculatePagination(
        page,
        limit,
        this.paginationConfig.ENTITY_LIMITS.SESSIONS,
        this.paginationConfig.DEFAULT_PAGE,
        this.paginationConfig.DEFAULT_LIMIT
      );

      return this.dbManager.forRead(async (dbClient) => {
        const sessions = await this.sessionDAO.findAllByUserIdAndIsActive({
          userId: userId,
          active: true,
          limit: pagination.limit,
          offset: pagination.offset,
          sortBy: validatedSort.sortBy,
          sortOrder: validatedSort.sortOrder,
          externalDbClient: dbClient,
        });

        const total = await this.sessionDAO.countAllByUserIdAndIsActive(
          userId,
          true,
          dbClient
        );
        const totalPages = this.paginationHelper.calculateTotalPages(
          total,
          pagination.limit
        );

        const response = this.paginationHelper.buildPaginationResponse({
          data: sessions,
          paginationInfo: pagination,
          total: total,
          totalPages: totalPages,
          itemsKey: "sessions",
        });
        return response;
      }, externalDbClient);
    });
  }
}

module.exports = SessionService;
