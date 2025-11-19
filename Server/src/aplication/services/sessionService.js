const {
  SORT_ORDER,
  SESSION_SORT_FIELD,
} = require("../../infrastructure/constants/sortConstants");

/**
 * Session management service for handling user session operations
 * @class SessionService
 * @description Manages session lifecycle, validation, and persistence operations
 */
class SessionService {
  /**
   * Creates a new SessionService instance
   * @constructor
   * @param {Object} dependencies - Service dependencies
   * @param {SessionDAO} dependencies.sessionDAO - Session data access object
   * @param {UserService} dependencies.userService - User service instance
   * @param {Object} dependencies.sessionMapper - Session mapper for data transformation
   * @param {Object} dependencies.dbManager - Database manager for transactions
   * @param {ErrorFactory} dependencies.errorFactory - Error factory instance
   * @param {Validator} dependencies.validator - Validation utility
   * @param {SortValidator} dependencies.sortValidator - Sort parameter validator
   * @param {Object} dependencies.appConfig - Application configuration
   * @param {PaginationHelper} dependencies.paginationHelper - Pagination utility
   * @param {Object} dependencies.paginationConfig - Pagination configuration
   * @param {ErrorMapper} dependencies.errorMapper - Error mapping utility
   */
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

  /**
   * Validates existing session by user ID and refresh token hash
   * @param {string} userId - User identifier
   * @param {string} refreshTokenHash - Hashed refresh token
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Object|null>} Valid session object or null if invalid
   */
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

  /**
   * Creates new user session
   * @param {Object} sessionData - Session creation data
   * @param {string} sessionData.userId - User identifier
   * @param {string} sessionData.refreshTokenHash - Hashed refresh token
   * @param {string} sessionData.userAgent - Client user agent
   * @param {string} sessionData.ip - Client IP address
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Object>} Created session object
   */
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

  /**
   * Validates session by user ID and refresh token hash
   * @param {string} userId - User identifier
   * @param {string} refreshTokenHash - Hashed refresh token
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Object>} Validated session object
   */
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

  /**
   * Validates session by user ID and session ID
   * @param {string} userId - User identifier
   * @param {string} sessionId - Session identifier
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Object>} Validated session object
   */
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

  /**
   * Deactivates session by user ID and refresh token hash
   * @param {string} userId - User identifier
   * @param {string} refreshTokenHash - Hashed refresh token
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Object>} Deactivation result
   */
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

  /**
   * Deactivates session by refresh token hash
   * @param {string} refreshTokenHash - Hashed refresh token
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Object>} Deactivation result
   */
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

  /**
   * Manages user session limit by deactivating oldest sessions if needed
   * @param {string} userId - User identifier
   * @param {number} [maxSessions=10] - Maximum allowed active sessions
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Object>} Session management result
   */
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

  /**
   * Deactivates all sessions for a user
   * @param {string} userId - User identifier
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Object>} Bulk deactivation result
   */
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

  /**
   * Retrieves session by ID
   * @param {string} sessionId - Session identifier
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Object>} Session object
   */
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

  /**
   * Deactivates specific session by ID
   * @param {string} sessionId - Session identifier
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Object>} Deactivation result
   */
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

  /**
   * Retrieves all active sessions for a user with pagination
   * @param {string} userId - User identifier
   * @param {string} currentSessionId - Current session ID for reference
   * @param {Object} [options={}] - Pagination and sorting options
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Object>} Paginated list of active sessions
   */
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
