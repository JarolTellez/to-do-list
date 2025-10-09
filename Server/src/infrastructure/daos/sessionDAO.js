const BaseDatabaseHandler = require("../config/baseDatabaseHandler");
const {
  SESSION_SORT_FIELD,
  SORT_ORDER,
} = require("../constants/sortConstants");

/**
 * Data Access Object for Session entity handling database operations
 * @class SessionDAO
 * @extends BaseDatabaseHandler
 */
class SessionDAO extends BaseDatabaseHandler {
  /**
   * Creates a new SessionDAO instance
   * @param {Object} dependencies - Dependencies for SessionDAO
   * @param {Object} dependencies.sessionMapper - Mapper for session data transformation from dbData to domain
   * @param {Object} dependencies.dbManager - Database manager for connection handling (prisma)
   * @param {Object} dependencies.errorFactory - Factory for creating app errors
   * @param {Object} dependencies.inputValidator - Validator for input parameters
   */
  constructor({ sessionMapper, dbManager, errorFactory, inputValidator }) {
    super({ dbManager, inputValidator, errorFactory });
    this.sessionMapper = sessionMapper;
  }

  /**
   * Creates a new session in the database
   * @param {Session} session - Session domain entity to create
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<Session>} Created session domain entity
   * @throws {ValidationError} If session data is invalid
   * @throws {ConflictError} If session with refresh token already exists
   * @throws {DatabaseError} On database operation failure
   */
  async create(session, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const createdSession = await dbClient.session.create({
          data: {
            refreshTokenHash: session.refreshTokenHash,
            userAgent: session.userAgent,
            ip: session.ip,
            expiresAt: session.expiresAt,
            isActive: session.isActive !== false,
            userId: session.userId,
          },
        });

        return this.sessionMapper.dbToDomain(createdSession);
      } catch (error) {
        if (error.code === "P2002") {
          throw this.errorFactory.createConflictError(
            "Ya existe una sesión con este refresh token",
            {
              field: "refreshTokenHash",
              operation: "sessionDAO.create",
              userId: session.userId,
            }
          );
        }
        this._handlePrismaError(error, "sessionDAO.create", {
          attemptedData: { userId: session.userId },
        });
      }
    }, externalDbClient);
  }

  /**
   * Deactivates a session by ID
   * @param {number|string} id - ID of the session to deactivate
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<boolean>} True if deactivation was successful
   * @throws {ValidationError} If session ID is invalid
   * @throws {NotFoundError} If session is not found
   * @throws {DatabaseError} On database operation failure
   */
  async deactivate(id, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const sessionIdNum = this.inputValidator.validateId(id, "session id");

        const session = await dbClient.session.update({
          where: { id: sessionIdNum },
          data: { isActive: false },
        });

        return !!session;
      } catch (error) {
        if (error.code === "P2025") {
          throw this.errorFactory.createNotFoundError(
            "Sesión no encontrada para desactivar",
            {
              sessionId: id,
              prismaCode: error.code,
              operation: "sessionDAO.deactivate",
            }
          );
        }
        this._handlePrismaError(error, "sessionDAO.deactivate", {
          sessionId: id,
        });
      }
    }, externalDbClient);
  }

  /**
   * Deactivates the oldest session for a specific user
   * @param {number|string} userId - ID of the user
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<boolean>} True if a session was deactivated, false otherwise
   * @throws {ValidationError} If the user ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async deactivateOldestByUserId(userId, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(userId, "user id");
        const oldestSession = await dbClient.session.findFirst({
          where: {
            userId: userIdNum,
            isActive: true,
          },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });

        if (!oldestSession) {
          return false;
        }

        await dbClient.session.update({
          where: { id: oldestSession.id },
          data: { isActive: false },
        });

        return true;
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }

        if (error.code === "P2025") {
          return false;
        }

        this._handlePrismaError(error, "sessionDAO.deactivateOldestByUserId", {
          userId,
        });
      }
    }, externalDbClient);
  }

  /**
   * Deactivates all active sessions for a user
   * @param {number|string} userId - ID of the user
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<number>} Number of sessions deactivated
   * @throws {ValidationError} If user ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async deactivateAllByUserId(userId, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(userId, "user id");

        const result = await dbClient.session.updateMany({
          where: {
            userId: userIdNum,
            isActive: true,
          },
          data: { isActive: false },
        });

        return result.count;
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }
        this._handlePrismaError(error, "sessionDAO.deactivateAllByUserId", {
          userId,
        });
      }
    }, externalDbClient);
  }
  /**
   * Finds a session by its ID
   * @param {number|string} id - ID of the session to find
   * @param {Object} externalDbClient - External Prisma transaction client
   * @returns {Promise<Session|null>} Session entity if found, null otherwise
   * @throws {ValidationError} If the session ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findById(id, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        const sessionIdNum = this.inputValidator.validateId(id, "session id");

        const session = await dbClient.session.findUnique({
          where: { id: sessionIdNum },
        });

        return session ? this.sessionMapper.dbToDomain(session) : null;
      } catch (error) {
        // Re-throw ValidationErrors (input issues)
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }

        this._handlePrismaError(error, "sessionDAO.findById", {
          attemptedData: { sessionId: id },
        });
      }
    }, externalDbClient);
  }

  /**
   * Finds a session by refresh token hash
   * @param {string} refreshTokenHash - Hash of the refresh token to find
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<Session|null>} Session domain entity if found, null otherwise
   * @throws {ValidationError} If refresh token hash is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findByRefreshTokenHash(refreshTokenHash, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        if (
          typeof refreshTokenHash !== "string" ||
          refreshTokenHash.trim().length === 0
        ) {
          throw this.errorFactory.createValidationError(
            "Invalid refresh token hash"
          );
        }

        const session = await dbClient.session.findFirst({
          where: {
            refreshTokenHash: refreshTokenHash.trim(),
            isActive: true,
          },
        });

        return session ? this.sessionMapper.dbToDomain(session) : null;
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }
        this._handlePrismaError(error, "sessionDAO.findByRefreshTokenHash", {
          hashLength: refreshTokenHash?.length,
        });
      }
    }, externalDbClient);
  }

  /**
   * Finds all sessions for a user with pagination and sorting
   * @param {Object} options - Query options
   * @param {number|string} options.userId - ID of the user
   * @param {Object} [options.externalDbClient=null] - External Prisma transaction client
   * @param {number} [options.limit=null] - Maximum number of sessions to return
   * @param {number} [options.offset=null] - Number of sessions to skip
   * @param {string} [options.sortBy=SESSION_SORT_FIELD.CREATED_AT] - Field to sort by
   * @param {string} [options.sortOrder="desc"] - Sort order (asc/desc)
   * @returns {Promise<Session[]>} Array of session domain entities
   * @throws {ValidationError} If user ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findAllByUserId({
    userId,
    externalDbClient = null,
    limit = null,
    offset = null,
    sortBy = SESSION_SORT_FIELD.CREATED_AT,
    sortOrder = "desc",
  } = {}) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(userId, "user id");

        const sortOptions = this._buildSortOptions(
          sortBy,
          sortOrder,
          SESSION_SORT_FIELD
        );
        const paginationOptions = this._buildPaginationOptions(limit, offset);

        const sessions = await dbClient.session.findMany({
          where: { userId: userIdNum },
          ...sortOptions,
          ...paginationOptions,
        });

        return sessions.map((session) =>
          this.sessionMapper.dbToDomain(session)
        );
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }
        this._handlePrismaError(error, "sessionDAO.findAllByUserId", {
          userId,
          limit,
          offset,
        });
      }
    }, externalDbClient);
  }

  /**
   * Retrieves sessions for a specific user filtered by active status
   * @param {Object} options - Configuration options for the query
   * @param {number|string} options.userId - ID of the user whose sessions to retrieve
   * @param {boolean} [options.active=true] - Active status to filter by
   * @param {Object} [options.externalDbClient=null] - External Prisma transaction client
   * @param {string} [options.sortBy=SESSION_SORT_FIELD.CREATED_AT] - Field to sort results by
   * @param {string} [options.sortOrder=SORT_ORDER.DESC] - Sort order (ASC/DESC)
   * @param {number} [options.limit=null] - Maximum number of records to return
   * @param {number} [options.offset=null] - Number of records to skip for pagination
   * @returns {Promise<Session[]>} Array of session domain entities
   * @throws {ValidationError} If the user ID is invalid or active is not a boolean
   * @throws {DatabaseError} On database operation failure
   */
  async findAllByUserIdAndIsActive({
    userId,
    externalDbClient = null,
    sortBy = SESSION_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
    active = true,
    limit = null,
    offset = null,
  } = {}) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(userId, "user id");

        if (typeof active !== "boolean") {
          throw this.errorFactory.createValidationError(
            "Active must be a boolean"
          );
        }

        const sortOptions = this._buildSortOptions(
          sortBy,
          sortOrder,
          SESSION_SORT_FIELD
        );
        const paginationOptions = this._buildPaginationOptions(limit, offset);

        const sessions = await dbClient.session.findMany({
          where: {
            userId: userIdNum,
            isActive: active,
          },
          ...sortOptions,
          ...paginationOptions,
        });

        return sessions.map((session) =>
          this.sessionMapper.dbToDomain(session)
        );
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }
        this._handlePrismaError(
          error,
          "sessionDAO.findAllByUserIdAndIsActive",
          {
            userId,
            active,
            limit,
            offset,
          }
        );
      }
    }, externalDbClient);
  }

  /**
   * Counts sessions for a specific user filtered by active status
   * @param {number|string} userId - ID of the user
   * @param {boolean} active - Active status to filter by
   * @param {Object} externalDbClient - External Prisma transaction client
   * @returns {Promise<number>} Total number of sessions matching the criteria
   * @throws {ValidationError} If the user ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async countAllByUserIdAndIsActive(userId, active, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(userId, "user id");

        const count = await dbClient.session.count({
          where: {
            userId: userIdNum,
            isActive: active,
          },
        });

        return count;
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }
        this._handlePrismaError(
          error,
          "sessionDAO.countAllByUserIdAndIsActive",
          {
            userId,
            active,
          }
        );
      }
    }, externalDbClient);
  }
}

module.exports = SessionDAO;
