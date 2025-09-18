const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");

const {
  SORT_ORDER,
  SESSION_SORT_FIELD,
} = require("../constants/sortConstants");

class SessionDAO extends BaseDatabaseHandler {
  constructor({ sessionMapper, connectionDB, errorFactory, inputValidator }) {
    super(connectionDB);
    this.sessionMapper = sessionMapper;
    this.errorFactory = errorFactory;
    this.inputValidator = inputValidator;
  }

  // Guardar una nueva sesión
  async create(session, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        "INSERT INTO sessions (user_id, refresh_token_hash, device_id, user_agent, ip, expires_at, is_active) VALUES (?,?,?,?,?,?,?)",
        [
          session.userId,
          session.refreshTokenHash,
          session.deviceId,
          session.userAgent,
          session.ip,
          session.expiresAt,
          session.isActive,
        ]
      );

      const actualSession = await this.findByIdAndUserId(
        result.insertId,
        session.userId,
        connection
      );

      return actualSession;
    } catch (error) {
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

      throw this.errorFactory.createDatabaseError("Failed to create session", {
        attemptedData: {
          userId: session.userId,
          deviceId: session.deviceId,
          context: "sessioDAO - create method",
        },

        originalError: error.message,
        code: error.code,
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // Desactivar una sesión por ID de la session
  async deactivate(id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const sessionIdNum = this.validators.validateId(id, "session id");
      const [result] = await connection.execute(
        "UPDATE sessions SET is_active = FALSE WHERE id = ?",
        [sessionIdNum]
      );

      return result.affectedRows > 0;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to deactive session",
        {
          attemptedData: { sessionId: id },
          originalError: error.message,
          code: error.code,
          context: "sessionDAO - deactivate method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // Desactivar todas las sessions de un usuario
  async deactivateAllByUserId(userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const userIdNum = this.validators.validateId(userId, "user id");
      const [result] = await connection.execute(
        "UPDATE sessions SET is_active=FALSE WHERE user_id=?",
        [userIdNum]
      );
      return result.affectedRows > 0;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      throw this.errorFactory.createDatabaseError(
        "Failed to deactive all user sessions",
        {
          attemptedData: { userId },
          originalError: error.message,
          code: error.code,
          context: "sessionDAO - deactiveAllByUserId",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async deactivateAllByUserIdAndDeviceId(
    userId,
    deviceId,
    externalConn = null
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const userIdNum = this.validators.validateId(userId, "user id");
  
      const [result] = await connection.execute(
        "UPDATE sessions SET is_active = FALSE WHERE user_id = ? AND device_id = ?",
        [userIdNum, deviceId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      throw this.errorFactory.createDatabaseError(
        "Failed to deactive all sessions by userId and deviceId",
        {
          attemptedData: { userId, deviceId },
          originalError: error.message,
          code: error.code,
          context: "sessionDAO - deactiveAllByUserIdAndDeviceId method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async deactivateOldestByUserId(userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const userIdNum = this.validators.validateId(userId, "user id");
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
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      throw this.errorFactory.createDatabaseError(
        "Failed to deactive oldest user session",
        {
          attemptedData: { userId },
          originalError: error.message,
          code: error.code,
          context: "sessionDAO - deactivateOldestByUserId method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findAll({
    externalConn = null,
    sortBy = SESSION_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
    limit = null,
    offset = null,
  } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const { safeField } = this.inputValidator.validateSortField(
        sortBy,
        SESSION_SORT_FIELD,
        "SESSION",
        "session sort field"
      );

      const { safeOrder } = this.inputValidator.validateSortOrder(
        sortOrder,
        SORT_ORDER
      );

      const queryParams = [];
      if (limit !== null) queryParams.push(limit);
      if (offset !== null) queryParams.push(offset);

      const [rows] = await connection.query(
        `SELECT 
         s.id AS session_id,
         s.user_id,
         s.refresh_token_hash,
         s.created_at,
         s.expires_at,
         s.is_active  
       FROM sessions s 
       ORDER BY ${safeField} ${safeOrder}, s.id ASC
       ${limit !== null ? "LIMIT ?" : ""}
       ${offset !== null ? "OFFSET ?" : ""}`,
        queryParams
      );

      const mappedSessions =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.sessionMapper.dbToDomain(row))
          : [];

      return mappedSessions;
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
          context: "sessionDAO - findAll method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
  // Consultar todas las sessions de un usuario
  async findAllByUserId({
    userId,
    externalConn = null,
    offset = null,
    limit = null,
    sortBy = SESSION_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
  } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.validators.validateId(userId, "user id");

      const { safeField } = this.inputValidator.validateSortField(
        sortBy,
        SESSION_SORT_FIELD,
        "SESSION",
        "session sort field"
      );

      const { safeOrder } = this.inputValidator.validateSortOrder(
        sortOrder,
        SORT_ORDER
      );

      const queryParams = [userIdNum];
      if (limit !== null) queryParams.push(limit);
      if (offset !== null) queryParams.push(offset);

      const [rows] = await connection.query(
        `SELECT 
     s.id AS session_id,
     s.user_id,
     s.created_at,
     s.expires_at,
     s.is_active
     FROM sessions s 
     WHERE s.user_id = ?
     ORDER BY ${safeField} ${safeOrder}, s.id ASC
     ${limit !== null ? "LIMIT ?" : ""} 
     ${offset !== null ? "OFFSET ?" : ""}`,
        queryParams
      );

      const mappedSessions =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.sessionMapper.dbToDomain(row))
          : [];

      return mappedSessions;
    } catch (error) {
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
          context: "sessionDAO - findAllByUserId method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findAllByUserIdAndIsActive({
    userId,
    externalConn = null,
    sortBy = SESSION_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
    active = true,
    limit = null,
    offset = null,
  } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.validators.validateId(userId, "user id");
       if (typeof active!== "boolean") {
        throw this.errorFactory.createValidationError(
          "Active must be a boolean"
        );
      }

      const { safeField } = this.inputValidator.validateSortField(
        sortBy,
        SESSION_SORT_FIELD,
        "SESSION",
        "session sort field"
      );

      const { safeOrder } = this.inputValidator.validateSortOrder(
        sortOrder,
        SORT_ORDER
      );

        const queryParams = [userIdNum, active];
      if (limit !== null) queryParams.push(limit);
      if (offset !== null) queryParams.push(offset);
      
      const [rows] = await connection.query(
        `SELECT 
           s.id AS session_id,
           s.user_id,
           s.created_at,
           s.expires_at,
           s.is_active
         FROM sessions s 
         WHERE s.user_id = ? AND s.is_active = ?
         ORDER BY ${safeField} ${safeOrder}, s.id ASC
         ${limit !== null ? "LIMIT ?" : ""} 
         ${offset !== null ? "OFFSET ?" : ""}`,
         queryParams
      );
  

      const mappedSessions =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.sessionMapper.dbToDomain(row))
          : [];

      return mappedSessions;
    } catch (error) {
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
          context: `sessionDAO - findAllByUserIdAndIsActive method (isActive: ${active})`,
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findAllActiveByUserIdAndRtHash({
    userId,
    refreshTokenHash,
    externalConn = null,
    limit = null,
    offset = null,
    sortBy = SESSION_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
  } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.validators.validateId(userId, "user id");

      if (!refreshTokenHash || typeof refreshTokenHash !== "string") {
        throw this.errorFactory.createValidationError(
          "Invalid refresh token hash"
        );
      }

      const { safeField } = this.inputValidator.validateSortField(
        sortBy,
        SESSION_SORT_FIELD,
        "SESSION",
        "session sort field"
      );

      const { safeOrder } = this.inputValidator.validateSortOrder(
        sortOrder,
        SORT_ORDER
      );

      
      const queryParams = [userIdNum, refreshTokenHash];
      if (limit !== null) queryParams.push(limit);
      if (offset !== null) queryParams.push(offset);

      const [rows] = await connection.query(
        `SELECT 
         s.id AS session_id,
         s.user_id,
         s.refresh_token_hash,
         s.created_at,
         s.expires_at,
         s.is_active
       FROM sessions s 
        WHERE s.user_id = ? AND s.refresh_token_hash = ? AND s.is_active = TRUE
       ORDER BY ${safeField} ${safeOrder}, s.id ASC
        ${limit !== null ? "LIMIT ?" : ""} 
       ${offset !== null ? "OFFSET ?" : ""}`,
        queryParams
      );

      const mappedSessions =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.sessionMapper.dbToDomain(row))
          : [];

      return mappedSessions;
    } catch (error) {
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
          context: "sessionDAO - findAllActivesSessionByUserIdAndRtHash method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
  // Consultar una sesión por refresh token hash
  async findByRefreshTokenHash(refreshTokenHash, externalConn = null) {
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

      // CONSULTA: Buscar sesión por hash
      const [rows] = await connection.execute(
        `SELECT 
         s.id AS session_id,
         s.user_id,
         s.refresh_token_hash,
         s.created_at,
         s.expires_at,
         s.is_active
       FROM sessions s 
       WHERE s.refresh_token_hash = ?`,
        [cleanHash]
      );

      // Early return si no se encuentra
      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.sessionMapper.dbToDomain(rows[0]);
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
          context: "sessionDAO - findByRefreshTokenHash method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findByIdAndUserId(id, userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const sessionIdNum = this.validators.validateId(id, "session id");
      const userIdNum = this.validators.validateId(userId, "user id");


      // CONSULTA: Buscar sesión por hash
      const [rows] = await connection.execute(
        `SELECT 
         s.id AS session_id,
         s.user_id,
         s.refresh_token_hash,
         s.created_at,
         s.expires_at,
         s.is_active
       FROM sessions s 
       WHERE s.id = ? AND s.user_id = ?`,
        [sessionIdNum, userIdNum]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.sessionMapper.dbToDomain(rows[0]);
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve session by id and userId",
        {
          attemptedData: {
            id: idNum,
            userId: userIdNum,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "sessionDAO - findByIdAndUserId",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
  async countAll(externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total FROM sessions s`
      );
      return Number(totalRows[0]?.total) || 0;
    } catch (error) {
      throw this.errorFactory.createDatabaseError(
        "Failed to count all sessions",
        {
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "sessionDAO: countAll method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
  // Contar sessions por usuario
  async countAllByUserId(userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.validators.validateId(userId, "user id");

      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total 
       FROM sessions s 
       WHERE s.user_id = ?`,
        [userIdNum]
      );

      return Number(totalRows[0]?.total) || 0;
    } catch (error) {
      throw this.errorFactory.createDatabaseError(
        "Failed to count sessions by user id",
        {
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "sessionDAO: countAllByUserId method",
          userId,
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // Contar sessions por usuario y estado
  async countAllByUserIdAndIsActive(userId, active, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.validators.validateId(userId, "user id");

      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total 
         FROM sessions s 
         WHERE s.user_id = ? AND s.is_active = ?`,
        [userIdNum, active]
      );

      return Number(totalRows[0]?.total) || 0;
    } catch (error) {
      throw this.errorFactory.createDatabaseError(
        "Failed to count sessions by user id and status",
        {
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "sessionDAO: countAllByUserIdAndIsActive method",
          userId,
          active,
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // Contar sessions activas por usuario y hash de refresh token
  async countAllActiveByUserIdAndRtHash(
    userId,
    refreshTokenHash,
    externalConn = null
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.validators.validateId(userId, "userS id");

      if (!refreshTokenHash || typeof refreshTokenHash !== "string") {
        throw this.errorFactory.createValidationError(
          "Invalid refresh token hash"
        );
      }

      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total 
       FROM sessions s 
       WHERE s.user_id = ? AND s.refresh_token_hash = ? AND s.is_active = TRUE`,
        [userIdNum, refreshTokenHash]
      );

      return Number(totalRows[0]?.total) || 0;
    } catch (error) {
      throw this.errorFactory.createDatabaseError(
        "Failed to count active sessions by user id and refresh token hash",
        {
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "sessionDAO: countAllActiveByUserIdAndRtHash method",
          userId,
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
}

module.exports = SessionDAO;
