const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");
const PAGINATION_CONFIG = require("../config/pagination");
const {
  DatabaseError,
  ConflictError,
  ValidationError,
} = require("../../utils/appErrors");

const {
  validateSortField,
  validateSortOrder,
} = require("../utils/validation/sortValidator");
const {
  calculatePagination,
  calculateTotalPages,
  buildPaginationResponse,
} = require("../utils/pagination");

const {
  SORT_ORDER,
  SESSION_SORT_FIELD,
} = require("../constants/sortConstants");

class SessionDAO extends BaseDatabaseHandler {
  constructor({ sessionMapper, connectionDB }) {
    super(connectionDB);
    this.sessionMapper = sessionMapper;
  }

  // Guardar una nueva sesión
  async create(session, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        "INSERT INTO sessions (user_id, refresh_token_hash, device_id, user_agent, ip, created_at, expires_at, is_active) VALUES (?,?,?,?,?,?,?,?)",
        [
          session.userId,
          session.refreshTokenHash,
          session.deviceId,
          session.userAgent,
          session.ip,
          session.createdAt,
          session.expiresAt,
          session.isActive,
        ]
      );

      const actualSession = this.findByIdAndUserId(
        result.insertId,
        session.userId
      );

      return actualSession;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw new ConflictError("A session already exists for this device", {
          attemptedData: {
            userId: session.userId,
            deviceId: session.deviceId,
          },
        });
      }

      throw new DatabaseError("Failed to create session", {
        attemptedData: {
          attemptedData: {
            userId: session.userId,
            deviceId: session.deviceId,
            context: "sessioDAO - create method",
          },
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
      const sessionIdNum = Number(id);
      if (!Number.isInteger(sessionIdNum) || sessionIdNum <= 0) {
        throw new ValidationError("Invalid session id");
      }
      const [result] = await connection.execute(
        "UPDATE sessions SET is_active = FALSE WHERE id = ?",
        [sessionIdNum]
      );

      return result.affectedRows > 0;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError("Failed to deactive session", {
        attemptedData: { sessionId: id },
        originalError: error.message,
        code: error.code,
        context: "sessionDAO - deactivate method",
      });
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
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new ValidationError("Invalid user id");
      }
      const [result] = await connection.execute(
        "UPDATE sessions SET is_active=FALSE WHERE user_id=?",
        [userIdNum]
      );
      return {
        affectedRows: result.affectedRows,
        message: `Deactivated ${result.affectedRows} sessions for user ${userIdNum}`,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError("Failed to deactive all user sessions", {
        attemptedData: { userId },
        originalError: error.message,
        code: error.code,
        context: "sessionDAO - deactiveAllByUserId",
      });
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
      const userIdNum = Number(userId);
      const deviceIdNum = Number(deviceId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new ValidationError("Invalid user id");
      }
      if (!Number.isInteger(deviceIdNum) || deviceIdNum <= 0) {
        throw new ValidationError("Invalid device id");
      }
      const [result] = await connection.execute(
        "UPDATE sessions SET is_active = FALSE WHERE user_id = ? AND device_id = ?",
        [userIdNum, deviceIdNum]
      );

      return {
        affectedRows: result.affectedRows,
        message: `Deactivated ${result.affectedRows} sessions for user ${userIdNum} and device ${deviceIdNum}`,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(
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
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new ValidationError("Invalid user id");
      }
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
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError("Failed to deactive oldest user session", {
        attemptedData: { userId },
        originalError: error.message,
        code: error.code,
        context: "sessionDAO - deactivateOldestByUserId method",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

 async findAll(
    {
      externalConn = null,
      page = PAGINATION_CONFIG.DEFAULT_PAGE,
      limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
      sortBy = SESSION_SORT_FIELD.CREATED_AT,
      sortOrder = SORT_ORDER.DESC,
    } = {}
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const { safeField } = validateSortField(
        sortBy,
        SESSION_SORT_FIELD,
        "SESSION",
        "session sort field"
      );

      const { safeOrder } = validateSortOrder(sortOrder, SORT_ORDER);

      const pagination = calculatePagination(
        page,
        limit,
        PAGINATION_CONFIG.MAX_LIMIT,
        PAGINATION_CONFIG.DEFAULT_PAGE,
        PAGINATION_CONFIG.DEFAULT_LIMIT
      );

      // CONSULTA 1: Contar total de TODAS las sessions
      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total FROM sessions s`
      );

      const total = Number(totalRows[0]?.total) || 0;
      const totalPages = calculateTotalPages(total, pagination.limit);

      // Early return si no hay datos o pagina invalida
      if (total === 0 || pagination.page > totalPages) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "sessions"
        );
      }

      // CONSULTA 2: Obtener IDs de TODAS las sessions paginadas
      const [sessionIdsResult] = await connection.query(
        `SELECT s.id
         FROM sessions s 
         ORDER BY ${safeField} ${safeOrder}, s.id ASC
         LIMIT ? OFFSET ?`,
        [pagination.limit, pagination.offset]
      );

      if (sessionIdsResult.length === 0) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "sessions"
        );
      }

      const sessionIds = sessionIdsResult.map((row) => row.id);

      // CONSULTA 3: Obtener detalles completos de las sessions paginadas
      const [rows] = await connection.query(
        `SELECT 
           s.id AS session_id,
           s.user_id,
           s.created_at,
           s.expires_at,
           s.is_active  // ← CORREGIDO: is_active en lugar de is_ative
         FROM sessions s 
         WHERE s.id IN (?)
         ORDER BY FIELD(s.id, ${sessionIds.map((_, index) => "?").join(",")})`,
        [sessionIds, ...sessionIds]
      );

      const mappedSessions =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.sessionMapper.dbToDomain(row))
          : [];

      return buildPaginationResponse(
        mappedSessions,
        pagination,
        total,
        totalPages,
        "sessions"
      );
    } catch (error) {
      throw new this.DatabaseError(
        "Failed to retrieve all sessions",
        {
          attemptedData: {
            page,
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
  async findAllByUserId(
    userId,
    {
      externalConn = null,
      page = PAGINATION_CONFIG.DEFAULT_PAGE,
      limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
      sortBy = SESSION_SORT_FIELD.CREATED_AT,
      sortOrder = SORT_ORDER.DESC,
    } = {}
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new ValidationError("Invalid user id");
      }

      const { safeField } = validateSortField(
        sortBy,
        SESSION_SORT_FIELD,
        "SESSION",
        "session sort field"
      );

      const { safeOrder } = validateSortOrder(sortOrder, SORT_ORDER);

      const pagination = calculatePagination(
        page,
        limit,
        PAGINATION_CONFIG.MAX_LIMIT,
        PAGINATION_CONFIG.DEFAULT_PAGE,
        PAGINATION_CONFIG.DEFAULT_LIMIT
      );

      // CONSULTA 1: Contar total de sessions del usuario
      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total 
       FROM sessions s 
       WHERE s.user_id = ?`,
        [userIdNum]
      );

      const total = Number(totalRows[0]?.total) || 0;
      const totalPages = calculateTotalPages(total, pagination.limit);

      // Early return si no hay datos o pagina invalida
      if (total === 0 || pagination.page > totalPages) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "sessions"
        );
      }

      // CONSULTA 2: Obtener IDs de sessions paginadas
      const [sessionIdsResult] = await connection.query(
        `SELECT s.id
       FROM sessions s 
       WHERE s.user_id = ?
       ORDER BY ${safeField} ${safeOrder}, s.id ASC
       LIMIT ? OFFSET ?`,
        [userIdNum, pagination.limit, pagination.offset]
      );

      if (sessionIdsResult.length === 0) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "sessions"
        );
      }

      const sessionIds = sessionIdsResult.map((row) => row.id);

      // CONSULTA 3: Obtener detalles completos solo para las sessions paginadas
      const [rows] = await connection.query(
        `SELECT 
         s.id AS session_id,
         s.user_id,
         s.created_at,
         s.expires_at,
         s.is_ative
       FROM sessions s 
       WHERE s.id IN (?)
       ORDER BY FIELD(s.id, ${sessionIds.map((_, index) => "?").join(",")})`,
        [sessionIds, ...sessionIds]
      );
      o;
      const mappedSessions =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.sessionMapper.dbToDomain(row))
          : [];

      return buildPaginationResponse(
        mappedSessions,
        pagination,
        total,
        totalPages,
        "sessions"
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new this.DatabaseError(
        "Failed to retrieve all sessions by userId",
        {
          attemptedData: {
            userId,
            page,
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

  async findAllByUserIdAndIsActive(
    userId,
    {
      externalConn = null,
      page = PAGINATION_CONFIG.DEFAULT_PAGE,
      limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
      sortBy = SESSION_SORT_FIELD.CREATED_AT,
      sortOrder = SORT_ORDER.DESC,
      active = true,
    } = {}
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new ValidationError("Invalid user id");
      }

      const { safeField } = validateSortField(
        sortBy,
        SESSION_SORT_FIELD,
        "SESSION",
        "session sort field"
      );

      const { safeOrder } = validateSortOrder(sortOrder, SORT_ORDER);

      const pagination = calculatePagination(
        page,
        limit,
        PAGINATION_CONFIG.MAX_LIMIT,
        PAGINATION_CONFIG.DEFAULT_PAGE,
        PAGINATION_CONFIG.DEFAULT_LIMIT
      );

      // CONSULTA 1: Contar total de sessions según el estado
      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total 
         FROM sessions s 
         WHERE s.user_id = ? AND s.is_active = ?`,
        [userIdNum, active]
      );

      const total = Number(totalRows[0]?.total) || 0;
      const totalPages = calculateTotalPages(total, pagination.limit);

      // Early return si no hay datos o pagina invalida
      if (total === 0 || pagination.page > totalPages) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "sessions"
        );
      }

      // CONSULTA 2: Obtener IDs de sessions paginadas según el estado
      const [sessionIdsResult] = await connection.query(
        `SELECT s.id
         FROM sessions s 
         WHERE s.user_id = ? AND s.is_active = ?
         ORDER BY ${safeField} ${safeOrder}, s.id ASC
         LIMIT ? OFFSET ?`,
        [userIdNum, active, pagination.limit, pagination.offset]
      );

      if (sessionIdsResult.length === 0) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "sessions"
        );
      }

      const sessionIds = sessionIdsResult.map((row) => row.id);

      // CONSULTA 3: Obtener detalles completos
      const [rows] = await connection.query(
        `SELECT 
           s.id AS session_id,
           s.user_id,
           s.created_at,
           s.expires_at,
           s.is_active
         FROM sessions s 
         WHERE s.id IN (?)
         ORDER BY FIELD(s.id, ${sessionIds.map((_, index) => "?").join(",")})`,
        [sessionIds, ...sessionIds]
      );

      const mappedSessions =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.sessionMapper.dbToDomain(row))
          : [];

      return buildPaginationResponse(
        mappedSessions,
        pagination,
        total,
        totalPages,
        "sessions"
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new this.DatabaseError(
        `Failed to retrieve ${
          active ? "active" : "inactive"
        } sessions by userId`,
        {
          attemptedData: {
            userId,
            active,
            page,
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

  async findAllActiveSessionByUserIdAndRtHash(
    userId,
    refreshTokenHash,
    {
      externalConn = null,
      page = PAGINATION_CONFIG.DEFAULT_PAGE,
      limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
      sortBy = SESSION_SORT_FIELD.CREATED_AT,
      sortOrder = SORT_ORDER.DESC,
    } = {}
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new ValidationError("Invalid user id");
      }

      if (!refreshTokenHash || typeof refreshTokenHash !== "string") {
        throw new ValidationError("Invalid refresh token hash");
      }

      const { safeField } = validateSortField(
        sortBy,
        SESSION_SORT_FIELD,
        "SESSION",
        "session sort field"
      );

      const { safeOrder } = validateSortOrder(sortOrder, SORT_ORDER);

      const pagination = calculatePagination(
        page,
        limit,
        PAGINATION_CONFIG.MAX_LIMIT,
        PAGINATION_CONFIG.DEFAULT_PAGE,
        PAGINATION_CONFIG.DEFAULT_LIMIT
      );

      // CONSULTA 1: Contar total de sessions activas con el hash
      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total 
       FROM sessions s 
       WHERE s.user_id = ? AND s.refresh_token_hash = ? AND s.is_active = TRUE`,
        [userIdNum, refreshTokenHash]
      );

      const total = Number(totalRows[0]?.total) || 0;
      const totalPages = calculateTotalPages(total, pagination.limit);

      if (total === 0 || pagination.page > totalPages) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "sessions"
        );
      }

      // CONSULTA 2: Obtener IDs de sessions paginadas
      const [sessionIdsResult] = await connection.query(
        `SELECT s.id
       FROM sessions s 
       WHERE s.user_id = ? AND s.refresh_token_hash = ? AND s.is_active = TRUE
       ORDER BY ${safeField} ${safeOrder}, s.id ASC
       LIMIT ? OFFSET ?`,
        [userIdNum, refreshTokenHash, pagination.limit, pagination.offset]
      );

      if (sessionIdsResult.length === 0) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "sessions"
        );
      }

      const sessionIds = sessionIdsResult.map((row) => row.id);

      // CONSULTA 3: Obtener detalles completos solo para las sessions paginadas
      const [rows] = await connection.query(
        `SELECT 
         s.id AS session_id,
         s.user_id,
         s.refresh_token_hash,
         s.created_at,
         s.expires_at,
         s.is_active
       FROM sessions s 
       WHERE s.id IN (?) AND s.user_id = ? AND s.refresh_token_hash = ? AND s.is_active = TRUE
       ORDER BY FIELD(s.id, ${sessionIds.map((_, index) => "?").join(",")})`,
        [sessionIds, userIdNum, refreshTokenHash, ...sessionIds]
      );

      const mappedSessions =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.sessionMapper.dbToDomain(row))
          : [];

      return buildPaginationResponse(
        mappedSessions,
        pagination,
        total,
        totalPages,
        "sessions"
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new this.DatabaseError(
        "Failed to retrieve all active sessions by userId and refreshTokenHash",
        {
          attemptedData: {
            userId,
            page,
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
        throw new ValidationError("Invalid refresh token hash");
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
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new this.DatabaseError(
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
      const idNum = Number(id);
      const userIdNum = Number(userId);

      if (!Number.isInteger(idNum) || idNum <= 0) {
        throw new ValidationError("Invalid session id");
      }
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new ValidationError("Invalid user id");
      }

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
        [idNum, userIdNum]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.sessionMapper.dbToDomain(rows[0]);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      console.error("Database error in SessionDAO.findByRefreshTokenHash:", {
        id: idNum,
        userId: userIdNum,
        error: error.message,
      });

      throw new this.DatabaseError(
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
}

module.exports = SessionDAO;
