const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");
const PAGINATION_CONFIG = require("../config/pagination");
const {
  DatabaseError,
  ConflictError,
  ValidationError,
} = require("../../utils/appErrors");

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

      // Asignar el ID generado
      session.idRefreshToken = result.insertId;

      return session;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw new ConflictError(
          "Ya existe una sesion para este dispositivo",
          {
            attemptedData: {
              userId: session.userId,
              deviceId: session.deviceId,
            },
          }
        );
      }

      throw new DatabaseError("Error al crear la sesion en la base de datos", {
        attemptedData: {
          attemptedData: {
            userId: session.userId,
            deviceId: session.deviceId,
          },
        },
        originalError: error.message,
        code: error.code,
      });
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  // Desactivar una sesión por ID de la session
  async deactivateById(id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      // Validación del userId
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

      throw new DatabaseError(
        "Error al desactivar la sesion en la base de datos",
        {
          attemptedData: { sessionId: id },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
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
      throw new DatabaseError(
        "Error al desactivar las sesiones del usuario en la base de datos",
        {
          attemptedData: { userId },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
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
        "Error al desactivar la  sesion en la base de datos",
        {
          attemptedData: { userId, deviceId },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
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
      throw new DatabaseError(
        "No se pudo eliminar la sesión más antigua del usuario en la base de datos",
        {
          attemptedData: { userId },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
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
    }
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new ValidationError("invalid user id");
      }

      if (!Object.values(SESSION_SORT_FIELD).includes(sortBy)) {
        throw new ValidationError(
          `Invalid sort field. Valid values: ${Object.values(
            SESSION_SORT_FIELD
          ).join(",")}`
        );
      }

      if (!Object.values(SORT_ORDER).includes(sortOrder)) {
        throw new ValidationError(
          `Invalid sort order. Valid values: ${Object.values(SORT_ORDER).join(
            ", "
          )}`
        );
      }

      const pageNum = Math.max(
        PAGINATION_CONFIG.DEFAULT_PAGE,
        parseInt(page, 10) || PAGINATION_CONFIG.DEFAULT_PAGE
      );
      let limitNum = parseInt(limit, 10) || PAGINATION_CONFIG.DEFAULT_LIMIT;

      // Aplicar limite maximo
      limitNum = Math.min(limitNum, PAGINATION_CONFIG.MAX_LIMIT);
      // aplicar limite minimo
      limitNum = Math.max(1, limitNum); // asegurar que sea al menos 1

      const offset = (pageNum - 1) * limitNum;

      const [totalRows] = await connection.execute(
        "SELECT COUNT(*) as total FROM sessions WHERE user_id = ?",
        [userIdNum]
      );

      const total = Number(totalRows[0]?.total) || 0;
      const totalPages = total > 0 ? Math.ceil(total / limitNum) : 0;

      // Si no hay datos retornar de una vez
      if (total === 0 || pageNum > totalPages) {
        return {
          sessions: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
            maxLimit: PAGINATION_CONFIG.MAX_LIMIT,
          },
        };
      }

      const [rows] = await connection.execute(
        `SELECT *
         FROM sessions 
         WHERE user_id = ? 
         ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
        `,
        [userIdNum, limitNum, offset]
      );

      const mappedSessions = Array.isArray(rows)
        ? rows.map((row) => this.sessionMapper.dbToDomain(row))
        : [];

      return {
        sessions: mappedSessions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          maxLimit: PAGINATION_CONFIG.MAX_LIMIT,
        },
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError("No se pudo consultar las sessions del usuario", {
        attemptedData: { userId },
        originalError: error.message,
        code: error.code,
      });
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async findAllActiveByUserId(
    userId,
    {
      externalConn = null,
      page = PAGINATION_CONFIG.DEFAULT_PAGE,
      limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
      sortBy = SESSION_SORT_FIELD.CREATED_AT,
      sortOrder = SORT_ORDER.DESC,
    }
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new ValidationError("invalid user id");
      }

      if (!Object.values(SESSION_SORT_FIELD).includes(sortBy)) {
        throw new ValidationError(
          `Invalid sort field. Valid values: ${Object.values(
            SESSION_SORT_FIELD
          ).join(",")}`
        );
      }

      if (!Object.values(SORT_ORDER).includes(sortOrder)) {
        throw new ValidationError(
          `Invalid sort order. Valid values: ${Object.values(SORT_ORDER).join(
            ", "
          )}`
        );
      }

      const pageNum = Math.max(
        PAGINATION_CONFIG.DEFAULT_PAGE,
        parseInt(page, 10) || PAGINATION_CONFIG.DEFAULT_PAGE
      );
      let limitNum = parseInt(limit, 10) || PAGINATION_CONFIG.DEFAULT_LIMIT;

      // Aplicar limite maximo
      limitNum = Math.min(limitNum, PAGINATION_CONFIG.MAX_LIMIT);
      // aplicar limite minimo
      limitNum = Math.max(1, limitNum); // asegurar que sea al menos 1

      const offset = (pageNum - 1) * limitNum;

      const [totalRows] = await connection.execute(
        "SELECT COUNT(*) as total FROM sessions WHERE user_id = ? AND is_active = TRUE",
        [userId]
      );

      const total = Number(totalRows[0]?.total) || 0;
      const totalPages = total > 0 ? Math.ceil(total / limitNum) : 0;

      // Si no hay datos retornar de una vez
      if (total === 0 || pageNum > totalPages) {
        return {
          sessions: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
            maxLimit: PAGINATION_CONFIG.MAX_LIMIT,
          },
        };
      }

      const [rows] = await connection.execute(
        `SELECT *
         FROM sessions 
         WHERE user_id = ? AND is_active = TRUE
         ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
        `,
        [userIdNum, limitNum, offset]
      );

      const mappedSessions = Array.isArray(rows)
        ? rows.map((row) => this.sessionMapper.dbToDomain(row))
        : [];

      return {
        sessions: mappedSessions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          maxLimit: PAGINATION_CONFIG.MAX_LIMIT,
        },
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError(
        "No se pudo consultar las sessions activas del usuario",
        {
          attemptedData: { userId },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
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
    }
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new ValidationError("invalid user id");
      }

        if (!refreshTokenHash || typeof refreshTokenHash !== "string") {
        throw new ValidationError("invalid refresh token hash");
      }


      if (!Object.values(SESSION_SORT_FIELD).includes(sortBy)) {
        throw new ValidationError(
          `Invalid sort field. Valid values: ${Object.values(
            SESSION_SORT_FIELD
          ).join(",")}`
        );
      }

      if (!Object.values(SORT_ORDER).includes(sortOrder)) {
        throw new ValidationError(
          `Invalid sort order. Valid values: ${Object.values(SORT_ORDER).join(
            ", "
          )}`
        );
      }

      const pageNum = Math.max(
        PAGINATION_CONFIG.DEFAULT_PAGE,
        parseInt(page, 10) || PAGINATION_CONFIG.DEFAULT_PAGE
      );
      let limitNum = parseInt(limit, 10) || PAGINATION_CONFIG.DEFAULT_LIMIT;

      // Aplicar limite maximo
      limitNum = Math.min(limitNum, PAGINATION_CONFIG.MAX_LIMIT);
      // aplicar limite minimo
      limitNum = Math.max(1, limitNum); // asegurar que sea al menos 1

      const offset = (pageNum - 1) * limitNum;

      const [totalRows] = await connection.execute(
        "SELECT COUNT(*) as total FROM sessions WHERE user_id = ? AND refresh_token_hash = ? AND is_active = TRUE",
        [userIdNum, refreshTokenHash]
      );

      const total = Number(totalRows[0]?.total) || 0;
      const totalPages = total > 0 ? Math.ceil(total / limitNum) : 0;

      // Si no hay datos retornar de una vez
      if (total === 0 || pageNum > totalPages) {
        return {
          sessions: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
            maxLimit: PAGINATION_CONFIG.MAX_LIMIT,
          },
        };
      }

      const [rows] = await connection.execute(
        `SELECT *
         FROM sessions 
         WHERE user_id = ? AND refresh_token_hash = ? AND is_active = TRUE
         ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
        `,
        [userIdNum, refreshTokenHash, limitNum, offset]
      );

      const mappedSessions = Array.isArray(rows)
        ? rows.map((row) => this.sessionMapper.dbToDomain(row))
        : [];

      return {
        sessions: mappedSessions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          maxLimit: PAGINATION_CONFIG.MAX_LIMIT,
        },
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError(
        "No se pudo consultar las sessions activas del usuario",
        {
          attemptedData: {
            userId: userIdNum,
            refreshTokenHash: refreshTokenHash,
          },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  // Consultar una sesión por refresh token hash
  async findByRefreshTokenHash(refreshTokenHash, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      if (!refreshTokenHash || typeof refreshTokenHash !== "string") {
        throw new ValidationError("invalid refresh token hash");
      }

    
      const [rows] = await connection.execute(
        "SELECT * FROM sessions WHERE refresh_token_hash = ?",
        [refreshTokenHash]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      const mappedSession = this.sessionMapper.dbToDomain(rows[0]);
      return mappedSession;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError(
        "No se pudo consultar la sesión por token de refresco",
        {
          attemptedData: { refreshTokenHash },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }
}

module.exports = SessionDAO;
