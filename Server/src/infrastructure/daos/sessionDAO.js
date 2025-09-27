const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");
const {
  SORT_ORDER,
  SESSION_SORT_FIELD,
  TASK_SORT_FIELD,
} = require("../constants/sortConstants");

class SessionDAO extends BaseDatabaseHandler {
  constructor({ sessionMapper, connectionDB, errorFactory, inputValidator }) {
    super(connectionDB, inputValidator, errorFactory);
    this.sessionMapper = sessionMapper;
    this.errorFactory = errorFactory;
    this.inputValidator = inputValidator;
  }

  /**
   * Creates a new session in the database
   * @param {Session} session - Session domain entity to persist
   * @param {number} session.user_id - Id of the user associated with the session
   * @param {string} session.refreshTokenHash - Hash of the refreshToken
   * @param {string} session.deviceId - Session device id
   * @param {string} session.ip - Session ip
   * @param {Date||string} session.expiresAt - Date when a session expires
   * @param {string} session.isActive - Session status
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions.
   * @returns {Promise<Task>} Persisted Session domain entity with assigned ID and timestamps.
   * @throws {DatabaseError} On database operation failure.
   * @throws {ConflictError} On duplicate deviceId for a active session
   */
  async create(session, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      // console.log(
      //   "VALORES EN DAO: ",
      //   session.userId,
      //   session.refreshTokenHash,
      //   session.userAgent,
      //   session.ip,
      //   session.expiresAt,
      //   session.isActive
      // );
      const [result] = await connection.execute(
        "INSERT INTO sessions (user_id, refresh_token_hash, user_agent, ip, expires_at, is_active) VALUES (?,?,?,?,?,?)",
        [
          session.userId,
          session.refreshTokenHash,
          session.userAgent,
          session.ip,
          session.expiresAt,
          session.isActive,
        ]
      );

      const actualSession = await this.findById(result.insertId, connection);

      return actualSession;
    } catch (error) {
      // Handle duplicated error
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw this.errorFactory.createConflictError(
          "A session already exists for this device",
          {
            attemptedData: {
              userId: session.userId,
              deviceId: session.deviceId,
            },
          }
        );
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError("Failed to create session", {
        attemptedData: {
          userId: session.userId,
          deviceId: session.deviceId,
          context: "sessionDAO.create",
        },

        originalError: error.message,
        code: error.code,
      });
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Deactivates a session by its ID
   * @param {number} id - ID of the session to deactivate
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<boolean>} True if the session was found and deactivated, false otherwise
   * @throws {ValidationError} If the session ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async deactivate(id, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const sessionIdNum = this.inputValidator.validateId(id, "session id");
      const [result] = await connection.execute(
        "UPDATE sessions SET is_active = FALSE WHERE id = ?",
        [sessionIdNum]
      );

      return result.affectedRows > 0;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to deactivate session",
        {
          attemptedData: { sessionId: id },
          originalError: error.message,
          code: error.code,
          context: "sessionDAO.deactivate",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Deactivates all sessions for a specific user
   * @param {number|string} userId - ID of the user whose sessions will be deactivated
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<boolean>} True if any sessions were deactivated, false otherwise
   * @throws {ValidationError} If the user ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async deactivateAllByUserId(userId, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const userIdNum = this.inputValidator.validateId(userId, "user id");
      const [result] = await connection.execute(
        "UPDATE sessions SET is_active=FALSE WHERE user_id=? AND is_active=TRUE",
        [userIdNum]
      );
      return result.affectedRows > 0;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      throw this.errorFactory.createDatabaseError(
        "Failed to deactivate all user sessions",
        {
          attemptedData: { userId },
          originalError: error.message,
          code: error.code,
          context: "sessionDAO.deactivateAllByUserId",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Deactivates all sessions for a specific user and device
   * @param {number|string} userId - ID of the user
   * @param {string} deviceId - Device identifier
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<boolean>} True if any sessions were deactivated, false otherwise
   * @throws {ValidationError} If the user ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  // async deactivateAllByUserIdAndDeviceId(
  //   userId,
  //   deviceId,
  //   externalConn = null
  // ) {
  //   // Get database connection (new or provided external for transactions)
  //   const { connection, isExternal } = await this.getConnection(externalConn);
  //   try {
  //     const userIdNum = this.inputValidator.validateId(userId, "user id");

  //     const [result] = await connection.execute(
  //       "UPDATE sessions SET is_active = FALSE WHERE user_id = ? AND device_id = ?",
  //       [userIdNum, deviceId]
  //     );

  //     return result.affectedRows > 0;
  //   } catch (error) {
  //        // Re-throw ValidationErrors (input issues)
  //     if (error instanceof this.errorFactory.Errors.ValidationError) {
  //       throw error;
  //     }
  //     throw this.errorFactory.createDatabaseError(
  //       "Failed to deactivate all sessions by userId and deviceId",
  //       {
  //         attemptedData: { userId, deviceId },
  //         originalError: error.message,
  //         code: error.code,
  //         context: "sessionDAO.deactivateAllByUserIdAndDeviceId",
  //       }
  //     );
  //   } finally {
  //     // Release only internal connection (external is managed by caller)
  //     if (connection && !isExternal) {
  //       await this.releaseConnection(connection, isExternal);
  //     }
  //   }
  // }

  /**
   * Deactivates the oldest session for a specific user
   * @param {number|string} userId - ID of the user
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<boolean>} True if a session was deactivated, false otherwise
   * @throws {ValidationError} If the user ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async deactivateOldestByUserId(userId, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const userIdNum = this.inputValidator.validateId(userId, "user id");
      const [result] = await connection.execute(
        `
        UPDATE sessions 
        SET is_active = FALSE
        WHERE user_id = ? 
        ORDER BY created_at ASC 
        LIMIT 1
      `,
        [userIdNum]
      );

      return result.affectedRows > 0;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      throw this.errorFactory.createDatabaseError(
        "Failed to deactivate oldest user session",
        {
          attemptedData: { userId },
          originalError: error.message,
          code: error.code,
          context: "sessionDAO.deactivateOldestByUserId",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Finds a session by its ID
   * @param {number|string} id - ID of the session to find
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<Session|null>} Session entity if found, null otherwise
   * @throws {ValidationError} If the session ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findById(id, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const sessionIdNum = this.inputValidator.validateId(id, "session id");

      const baseQuery = `SELECT 
         s.id AS session_id,
         s.user_id,
         s.refresh_token_hash,
         s.user_agent,
         s.ip,
         s.created_at AS session_created_at,
         s.expires_at AS session_expires_at,
         s.is_active
       FROM sessions s 
       WHERE s.id = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [sessionIdNum],
        mapper: this.sessionMapper.dbToDomain,
      });

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve session by id and userId",
        {
          attemptedData: {
            id: sessionIdNum,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "sessionDAO.findByIdAndUserId",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
  /**
   * Finds a session by refresh token hash
   * @param {string} refreshTokenHash - Hash of the refresh token to search for
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<Session|null>} Session entity if found, null otherwise
   * @throws {ValidationError} If the refresh token hash is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findByRefreshTokenHash(refreshTokenHash, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      if (
        typeof refreshTokenHash !== "string" ||
        refreshTokenHash.trim().length === 0
      ) {
        throw this.errorFactory.createValidationError(
          "Invalid refresh token hash"
        );
      }

      const cleanHash = refreshTokenHash.trim();

      const baseQuery = `SELECT 
         s.id AS session_id,
         s.user_id,
         s.refresh_token_hash,
         s.user_agent,
         s.ip,
         s.created_at AS session_created_at,
         s.expires_at AS session_expires_at,
         s.is_active
       FROM sessions s 
       WHERE s.refresh_token_hash = ? AND s.is_active = TRUE`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [cleanHash],
        mapper: this.sessionMapper.dbToDomain,
      });

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve session by refreshTokenHash",
        {
          attemptedData: {
            hashLength: refreshTokenHash?.length || 0,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "sessionDAO.findByRefreshTokenHash",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Retrieves all sessions from the database with optional pagination and sorting
   * @param {Object} [options={}] - Configuration options for the query
   * @param {import('mysql2').Connection} [options.externalConn=null] - External database connection for transactions
   * @param {string} [options.sortBy=SESSION_SORT_FIELD.CREATED_AT] - Field to sort results by
   * @param {string} [options.sortOrder=SORT_ORDER.DESC] - Sort order (ASC or DESC)
   * @param {number} [options.limit=null] - Maximum number of records to return
   * @param {number} [options.offset=null] - Number of records to skip for pagination
   * @returns {Promise<Array<Session>>} Array of session entities
   * @throws {DatabaseError} On database operation failure
   */
  async findAll({
    externalConn = null,
    sortBy = SESSION_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
    limit = null,
    offset = null,
  } = {}) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const baseQuery = `SELECT 
         s.id AS session_id,
         s.user_id,
         s.refresh_token_hash,
         s.user_agent,
         s.ip,
          s.created_at AS session_created_at,
         s.expires_at AS session_expires_at,
         s.is_active  
       FROM sessions s `;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        sortBy,
        sortOrder,
        sortConstants: TASK_SORT_FIELD,
        entityType: "USER",
        entityName: "user",
        limit,
        offset,
        mapper: this.sessionMapper.dbToDomain,
      });

      return result;
    } catch (error) {
      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve all sessions",
        {
          attemptedData: {
            offset,
            limit,
            sortBy,
            sortOrder,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "sessionDAO.findAll",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
  /**
   * Retrieves all sessions for a specific user with optional pagination and sorting
   * @param {Object} options - Configuration options for the query
   * @param {number} options.userId - ID of the user whose sessions to retrieve
   * @param {import('mysql2').Connection} [options.externalConn=null] - External database connection for transactions
   * @param {number} [options.offset=null] - Number of records to skip for pagination
   * @param {number} [options.limit=null] - Maximum number of records to return
   * @param {string} [options.sortBy=SESSION_SORT_FIELD.CREATED_AT] - Field to sort results by
   * @param {string} [options.sortOrder=SORT_ORDER.DESC] - Sort order (ASC or DESC)
   * @returns {Promise<Array<Session>>} Array of session entities
   * @throws {ValidationError} If the user ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findAllByUserId({
    userId,
    externalConn = null,
    offset = null,
    limit = null,
    sortBy = SESSION_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
  } = {}) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      const baseQuery = `SELECT 
     s.id AS session_id,
     s.user_id,
      s.created_at AS session_created_at,
         s.expires_at AS session_expires_at,
     s.is_active
     FROM sessions s 
     WHERE s.user_id = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [userIdNum],
        sortBy,
        sortOrder,
        sortConstants: TASK_SORT_FIELD,
        entityType: "USER",
        entityName: "user",
        limit,
        offset,
        mapper: this.sessionMapper.dbToDomain,
      });
      return result;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve all sessions by userId",
        {
          attemptedData: {
            userId,
            offset,
            limit,
            sortBy,
            sortOrder,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "sessionDAO.findAllByUserId",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Retrieves sessions for a specific user filtered by active status
   * @param {Object} options - Configuration options for the query
   * @param {number} options.userId - ID of the user whose sessions to retrieve
   * @param {boolean} options.active - Active status to filter by
   * @param {import('mysql2').Connection} [options.externalConn=null] - External database connection for transactions
   * @param {string} [options.sortBy=SESSION_SORT_FIELD.CREATED_AT] - Field to sort results by
   * @param {string} [options.sortOrder=SORT_ORDER.DESC] - Sort order (ASC or DESC)
   * @param {number} [options.limit=null] - Maximum number of records to return
   * @param {number} [options.offset=null] - Number of records to skip for pagination
   * @returns {Promise<Array<Session>>} Array of session entities
   * @throws {ValidationError} If the user ID is invalid or active is not a boolean
   * @throws {DatabaseError} On database operation failure
   */
  async findAllByUserIdAndIsActive({
    userId,
    externalConn = null,
    sortBy = SESSION_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
    active = true,
    limit = null,
    offset = null,
  } = {}) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.inputValidator.validateId(userId, "user id");
      if (typeof active !== "boolean") {
        throw this.errorFactory.createValidationError(
          "Active must be a boolean"
        );
      }

      const baseQuery = `SELECT 
           s.id AS session_id,
           s.user_id,
            s.created_at AS session_created_at,
         s.expires_at AS session_expires_at,
           s.is_active
         FROM sessions s 
         WHERE s.user_id = ? AND s.is_active = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [userIdNum],
        sortBy,
        sortOrder,
        sortConstants: TASK_SORT_FIELD,
        entityType: "USER",
        entityName: "user",
        limit,
        offset,
        mapper: this.sessionMapper.dbToDomain,
      });
      return result;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        `Failed to retrieve ${
          active ? "active" : "inactive"
        } sessions by userId`,
        {
          attemptedData: {
            userId,
            active,
            offset,
            limit,
            sortBy,
            sortOrder,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: `sessionDAO.findAllByUserIdAndIsActive`,
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Retrieves active sessions for a specific user and refresh token hash
   * @param {Object} options - Configuration options for the query
   * @param {number} options.userId - ID of the user
   * @param {string} options.refreshTokenHash - Hash of the refresh token
   * @param {import('mysql2').Connection} [options.externalConn=null] - External database connection for transactions
   * @param {number} [options.limit=null] - Maximum number of records to return
   * @param {number} [options.offset=null] - Number of records to skip for pagination
   * @param {string} [options.sortBy=SESSION_SORT_FIELD.CREATED_AT] - Field to sort results by
   * @param {string} [options.sortOrder=SORT_ORDER.DESC] - Sort order (ASC or DESC)
   * @returns {Promise<Array<Session>>} Array of active session entities
   * @throws {ValidationError} If the user ID is invalid or refresh token hash is missing
   * @throws {DatabaseError} On database operation failure
   */
  async findAllActiveByUserIdAndRtHash({
    userId,
    refreshTokenHash,
    externalConn = null,
    limit = null,
    offset = null,
    sortBy = SESSION_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
  } = {}) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      if (!refreshTokenHash || typeof refreshTokenHash !== "string") {
        throw this.errorFactory.createValidationError(
          "Invalid refresh token hash"
        );
      }

      const baseQuery = `SELECT 
         s.id AS session_id,
         s.user_id,
         s.refresh_token_hash,
         s.user_agent,
         s.ip,
          s.created_at AS session_created_at,
         s.expires_at AS session_expires_at,
         s.is_active
       FROM sessions s 
        WHERE s.user_id = ? AND s.refresh_token_hash = ? AND s.is_active = TRUE`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [userIdNum, refreshTokenHash],
        sortBy,
        sortOrder,
        sortConstants: TASK_SORT_FIELD,
        entityType: "USER",
        entityName: "user",
        limit,
        offset,
        mapper: this.sessionMapper.dbToDomain,
      });
      return result;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve all active sessions by userId and refreshTokenHash",
        {
          attemptedData: {
            userId,
            offset,
            limit,
            sortBy,
            sortOrder,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "sessionDAO.findAllActiveByUserIdAndRtHash",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Counts all sessions in the database
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<number>} Total number of sessions
   * @throws {DatabaseError} On database operation failure
   */
  async countAll(externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const baseQuery = `SELECT COUNT(*) AS total FROM sessions s`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
      });
      return Number(result[0]?.total) || 0;
    } catch (error) {
      throw this.errorFactory.createDatabaseError(
        "Failed to count all sessions",
        {
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "sessionDAO.countAll",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
  /**
   * Counts all sessions for a specific user
   * @param {number|string} userId - ID of the user
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<number>} Total number of sessions for the user
   * @throws {ValidationError} If the user ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async countAllByUserId(userId, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      const baseQuery = `SELECT COUNT(*) AS total 
       FROM sessions s 
       WHERE s.user_id = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [userIdNum],
      });

      return Number(result[0]?.total) || 0;
    } catch (error) {
      throw this.errorFactory.createDatabaseError(
        "Failed to count sessions by user id",
        {
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "sessionDAO.countAllByUserId",
          userId,
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Counts sessions for a specific user filtered by active status
   * @param {number|string} userId - ID of the user
   * @param {boolean} active - Active status to filter by
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<number>} Total number of sessions matching the criteria
   * @throws {ValidationError} If the user ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async countAllByUserIdAndIsActive(userId, active, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      const baseQuery = `SELECT COUNT(*) AS total 
         FROM sessions s 
         WHERE s.user_id = ? AND s.is_active = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [userIdNum, active],
      });
      return Number(result[0]?.total) || 0;
    } catch (error) {
      throw this.errorFactory.createDatabaseError(
        "Failed to count sessions by user id and status",
        {
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "sessionDAO.countAllByUserIdAndIsActive",
          userId,
          active,
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Counts active sessions for a specific user and refresh token hash
   * @param {number|string} userId - ID of the user
   * @param {string} refreshTokenHash - Hash of the refresh token
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<number>} Total number of active sessions matching the criteria
   * @throws {ValidationError} If the user ID is invalid or refresh token hash is missing
   * @throws {DatabaseError} On database operation failure
   */
  async countAllActiveByUserIdAndRtHash(
    userId,
    refreshTokenHash,
    externalConn = null
  ) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      // Get database connection (new or provided external for transactions)
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      if (!refreshTokenHash || typeof refreshTokenHash !== "string") {
        throw this.errorFactory.createValidationError(
          "Invalid refresh token hash"
        );
      }

      const baseQuery = `SELECT COUNT(*) AS total 
       FROM sessions s 
       WHERE s.user_id = ? AND s.refresh_token_hash = ? AND s.is_active = TRUE`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [userIdNum, refreshTokenHash],
      });
      return Number(result[0]?.total) || 0;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to count active sessions by user id and refresh token hash",
        {
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "sessionDAO.countAllActiveByUserIdAndRtHash",
          userId,
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
}

module.exports = SessionDAO;
