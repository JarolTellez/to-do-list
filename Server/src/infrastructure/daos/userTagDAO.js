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
  USER_TAG_SORT_FIELD,
} = require("../constants/sortConstants");

class UserTagDAO extends BaseDatabaseHandler {
  constructor({ tagMapper, connectionDB, DatabaseError, ConflictError }) {
    super(connectionDB);
    this.tagMapper = tagMapper;
    this.DatabaseError = DatabaseError;
    this.ConflictError = ConflictError;
    this.ValidationError = ValidationError;
  }

  async create(userTag, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const { userId, tagId } = userTag;

      const userIdNum = Number(userId);
      const tagIdNum = Number(tagId);

      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new this.ValidationError("Invalid user id");
      }
      if (!Number.isInteger(tagIdNum) || tagIdNum <= 0) {
        throw new this.ValidationError("Invalid tag id");
      }

      const [result] = await connection.execute(
        `INSERT INTO user_tag (user_id, tag_id) VALUES(?,?)`,
        [userIdNum, tagIdNum]
      );

      const actualUserTag = await this.findByIdAndUserId(
        result.insertId,
        userIdNum
      );

      return actualUserTag;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw new this.ConflictError(
          "Este usuario ya tiene asignado esta etiqueta",
          { attemptedData: { userId: userTag.userId, tagId: userTag.tagId } }
        );
      }

      if (error.code === "ER_NO_REFERENCED_ROW" || error.errno === 1452) {
        throw new this.ConflictError(
          "El usuario o etiqueta referenciada no existe",
          { attemptedData: { userId: userTag.userId, tagId: userTag.tagId } }
        );
      }

      if (error instanceof this.ValidationError) {
        throw error;
      }

      throw new this.DatabaseError(
        "Error al crear la relación userTag en la base de datos",
        {
          attemptedData: { userId: userTag.userId, tagId: userTag.tagId },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
        }
      );
    } finally {
      if (connection && !isExternal) {
        try {
          await this.releaseConnection(connection, isExternal);
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError.message);
        }
      }
    }
  }

  // DELETE
  async delete(id, userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const idNum = Number(id);
      const userIdNum = Number(userId);

      if (!Number.isInteger(idNum) || idNum <= 0) {
        throw new this.ValidationError("Invalid user tag id");
      }

      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new this.ValidationError("Invalid user id");
      }

      const [result] = await connection.execute(
        "DELETE FROM user_tag WHERE id = ? AND user_id = ?",
        [idNum, userIdNum]
      );

      return result.affectedRows > 0;
    } catch (error) {
      if (error instanceof this.ValidationError) {
        throw error;
      }

      throw new this.DatabaseError(
        "Error al eliminar la relación userTag de la base de datos",
        {
          attemptedData: { id, userId },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
        }
      );
    } finally {
      if (connection && !isExternal) {
        try {
          await this.releaseConnection(connection, isExternal);
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError.message);
        }
      }
    }
  }

  async deleteByUserIdAndTagId(userId, tagId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = Number(userId);
      const tagIdNum = Number(tagId);

      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new this.ValidationError("Invalid user id");
      }

      if (!Number.isInteger(tagIdNum) || tagIdNum <= 0) {
        throw new this.ValidationError("Invalid tag id");
      }

      const [result] = await connection.execute(
        "DELETE FROM user_tag WHERE user_id = ? AND tag_id = ?",
        [userIdNum, tagIdNum]
      );

      return result.affectedRows > 0;
    } catch (error) {
      if (error instanceof this.ValidationError) {
        throw error;
      }

      throw new this.DatabaseError(
        "Error al eliminar la relación userTag por user_id y tag_id",
        {
          attemptedData: { userId, tagId },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
        }
      );
    } finally {
      if (connection && !isExternal) {
        try {
          await this.releaseConnection(connection, isExternal);
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError.message);
        }
      }
    }
  }

  async deleteAllByUserId(userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new this.ValidationError("Invalid user id");
      }

      const [result] = await connection.execute(
        "DELETE FROM user_tag WHERE user_id = ?",
        [userIdNum]
      );

      return result.affectedRows;
    } catch (error) {
      if (error instanceof this.ValidationError) {
        throw error;
      }

      throw new this.DatabaseError(
        "Error al eliminar todas las relaciones userTag del usuario",
        {
          attemptedData: { userId },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
        }
      );
    } finally {
      if (connection && !isExternal) {
        try {
          await this.releaseConnection(connection, isExternal);
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError.message);
        }
      }
    }
  }

  async deleteAllByTagId(tagId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const tagIdNum = Number(tagId);
      if (!Number.isInteger(tagIdNum) || tagIdNum <= 0) {
        throw new this.ValidationError("Invalid tag id");
      }

      const [result] = await connection.execute(
        "DELETE FROM user_tag WHERE tag_id = ?",
        [tagIdNum]
      );

      return result.affectedRows;
    } catch (error) {
      if (error instanceof this.ValidationError) {
        throw error;
      }

      throw new this.DatabaseError(
        "Error al eliminar todas las relaciones userTag de la etiqueta",
        {
          attemptedData: { tagId },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
        }
      );
    } finally {
      if (connection && !isExternal) {
        try {
          await this.releaseConnection(connection, isExternal);
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError.message);
        }
      }
    }
  }

  async findByIdAndUserId(id, userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const idNum = Number(id);
      const userIdNum = Number(userId);

      if (!Number.isInteger(idNum) || idNum <= 0) {
        throw new this.ValidationError("Invalid user tag id");
      }

      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new this.ValidationError("Invalid user id");
      }

      const [rows] = await connection.execute(
        `SELECT 
           ut.id AS user_tag_id,
           ut.user_id,
           ut.tag_id,
           ut.created_at AS user_tag_created_at
         FROM user_tag ut 
         WHERE ut.id = ? AND ut.user_id = ?`,
        [idNum, userIdNum]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.tagMapper.dbToDomain(rows[0]);
    } catch (error) {
      if (error instanceof this.ValidationError) {
        throw error;
      }

      throw new this.DatabaseError(
        "Error al consultar la relación userTag por id y user_id",
        {
          attemptedData: { id, userId },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
        }
      );
    } finally {
      if (connection && !isExternal) {
        try {
          await this.releaseConnection(connection, isExternal);
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError.message);
        }
      }
    }
  }

  async findByUserIdAndTagId(userId, tagId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = Number(userId);
      const tagIdNum = Number(tagId);

      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new this.ValidationError("Invalid user id");
      }

      if (!Number.isInteger(tagIdNum) || tagIdNum <= 0) {
        throw new this.ValidationError("Invalid tag id");
      }

      const [rows] = await connection.execute(
        `SELECT 
           ut.id AS user_tag_id,
           ut.user_id,
           ut.tag_id,
           ut.created_at AS user_tag_created_at
         FROM user_tag ut 
         WHERE ut.user_id = ? AND ut.tag_id = ?`,
        [userIdNum, tagIdNum]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.tagMapper.dbToDomain(rows[0]);
    } catch (error) {
      if (error instanceof this.ValidationError) {
        throw error;
      }

      throw new this.DatabaseError(
        "Error al consultar la relación userTag por user_id y tag_id",
        {
          attemptedData: { userId, tagId },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
        }
      );
    } finally {
      if (connection && !isExternal) {
        try {
          await this.releaseConnection(connection, isExternal);
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError.message);
        }
      }
    }
  }

  async findAllByTagId(
    tagId,
    {
      externalConn = null,
      page = PAGINATION_CONFIG.DEFAULT_PAGE,
      limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
      sortBy = USER_TAG_SORT_FIELD.CREATED_AT,
      sortOrder = SORT_ORDER.DESC,
    } = {}
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const tagIdNum = Number(tagId);
      if (!Number.isInteger(tagIdNum) || tagIdNum <= 0) {
        throw new this.ValidationError("Invalid tag id");
      }
      const { safeField } = validateSortField(
        sortBy,
        USER_TAG_SORT_FIELD,
        "USER_TAG",
        "user tag sort field"
      );

      const { safeOrder } = validateSortOrder(sortOrder, SORT_ORDER);

      const pagination = calculatePagination(
        page,
        limit,
        PAGINATION_CONFIG.MAX_LIMIT,
        PAGINATION_CONFIG.DEFAULT_PAGE,
        PAGINATION_CONFIG.DEFAULT_LIMIT
      );

      // CONSULTA 1: Contar total de user_tags del tag
      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total 
         FROM user_tag ut 
         WHERE ut.tag_id = ?`,
        [tagIdNum]
      );

      const total = Number(totalRows[0]?.total) || 0;
      const totalPages = calculateTotalPages(total, pagination.limit);

      if (total === 0 || pagination.page > totalPages) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "user_tags"
        );
      }

      // CONSULTA 2: Obtener IDs de user_tags paginados
      const [userTagIdsResult] = await connection.query(
        `SELECT ut.id
         FROM user_tag ut 
         WHERE ut.tag_id = ?
         ORDER BY ${safeField} ${safeOrder}, ut.id ASC
         LIMIT ? OFFSET ?`,
        [tagIdNum, pagination.limit, pagination.offset]
      );

      if (userTagIdsResult.length === 0) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "user_tags"
        );
      }

      const userTagIds = userTagIdsResult.map((row) => row.id);

      // CONSULTA 3: Obtener detalles completos
      const [rows] = await connection.query(
        `SELECT 
           ut.id AS user_tag_id,
           ut.user_id,
           ut.tag_id,
           ut.created_at AS user_tag_created_at
         FROM user_tag ut 
         WHERE ut.id IN (?)
         ORDER BY FIELD(ut.id, ${userTagIds.map((_, index) => "?").join(",")})`,
        [userTagIds, ...userTagIds]
      );

      const mappedUserTags =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.tagMapper.dbToDomain(row))
          : [];

      return buildPaginationResponse(
        mappedUserTags,
        pagination,
        total,
        totalPages,
        "user_tags"
      );
    } catch (error) {
      if (error instanceof this.ValidationError) {
        throw error;
      }

      console.error("Database error in UserTagDAO.findAllByTagId:", {
        tagId,
        page,
        limit,
        sortBy,
        sortOrder,
        error: error.message,
      });

      throw new this.DatabaseError(
        "Error al consultar las relaciones userTag de la etiqueta",
        {
          attemptedData: {
            tagId,
            page,
            limit,
            sortBy,
            sortOrder,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
        }
      );
    } finally {
      if (connection && !isExternal) {
        try {
          await this.releaseConnection(connection, isExternal);
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError.message);
        }
      }
    }
  }
}

module.exports = UserTagDAO;
