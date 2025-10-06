const BaseDatabaseHandler = require("../config/baseDatabaseHandler");
const {
  SESSION_SORT_FIELD,
  SORT_ORDER,
} = require("../constants/sortConstants");

class SessionDAO extends BaseDatabaseHandler {
  constructor({ sessionMapper, dbManager, errorFactory, inputValidator }) {
    super({ dbManager, inputValidator, errorFactory });
    this.sessionMapper = sessionMapper;
  }

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
        this._handlePrismaError(error, "sessionDAO.create", {
          attemptedData: { userId: session.userId },
        });
      }
    }, externalDbClient);
  }

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
          return false; 
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
   * @param {Object} externalDbClient - External Prisma transaction client
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
   * @param {number} options.userId - ID of the user whose sessions to retrieve
   * @param {boolean} options.active - Active status to filter by
   * @param {Object} options.externalDbClient - External Prisma transaction client
   * @param {string} options.sortBy - Field to sort results by
   * @param {string} options.sortOrder - Sort order (ASC or DESC)
   * @param {number} options.limit - Maximum number of records to return
   * @param {number} options.offset - Number of records to skip for pagination
   * @returns {Promise<Array<Session>>} Array of session entities
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
