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

const { SORT_ORDER, TAG_SORT_FIELD } = require("../constants/sortConstants");

class TagDAO extends BaseDatabaseHandler {
  constructor({ tagMapper, connectionDB }) {
    super(connectionDB);
    this.tagMapper = tagMapper;
  }

  async create(tag, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        "INSERT INTO tags (name, user_id) VALUES(?, ?)",
        [tag.name, tag.userId]
      );
      const actualTag = this.findById(result.insertId);

      return actualTag;
    } catch (error) {
      // Error para duplicados
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw new ConflictError(
          "Ya existe una etiqueta con ese nombre para este usuario",
          { name: tag.name, userId: tag.userId }
        );
      }

      throw new DatabaseError(
        "Error al crear la etiqueta en la base de datos",
        {
          originalError: error.message,
          code: error.code,
          attemptedData: { name: tag.name, userId: tag.userId },
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

  async update(tag, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        "UPDATE tags SET name = ? WHERE id = ?",
        [tag.name, tag.id]
      );
      return tag;
    } catch (error) {
      // Error de duplicado al actualizar
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw new ConflictError("Ya existe una etiqueta con ese nombre", {
          attemptedData: { tagName: tag.name },
        });
      }

      throw new DatabaseError(
        "Error al actualizar la etiqueta en la base de datos",
        {
          originalError: error.message,
          code: error.code,
          attemptedData: { tagId: tag.id, tagName: tag.name },
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

  async delete(id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        "DELETE FROM tags WHERE id = ?",
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      // Manejar error de clave foranea
      if (error.code === "ER_ROW_IS_REFERENCED" || error.errno === 1451) {
        throw new ConflictError(
          "No se puede eliminar la etiqueta porque está siendo utilizada",
          { attemptedData: { tagId: id } }
        );
      }

      throw new DatabaseError(
        "Error al eliminar la etiqueta de la base de datos",
        {
          attemptedData: { tagId: id },
          originalError: error.message,
          code: error.code,
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

  //obtiene todas las etiquetas
  async findAll({
    externalConn = null,
    page = PAGINATION_CONFIG.DEFAULT_PAGE,
    limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
    sortBy = TAG_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
  } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const { safeField } = validateSortField(
        sortBy,
        TAG_SORT_FIELD,
        "TAG",
        "tag sort field"
      );

      const { safeOrder } = validateSortOrder(sortOrder, SORT_ORDER);

      const pagination = calculatePagination(
        page,
        limit,
        PAGINATION_CONFIG.MAX_LIMIT,
        PAGINATION_CONFIG.DEFAULT_PAGE,
        PAGINATION_CONFIG.DEFAULT_LIMIT
      );

      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total FROM tags`
      );
      const total = Number(totalRows[0]?.total) || 0;
      const totalPages = calculateTotalPages(total, pagination.limit);

      if (total === 0 || pagination.page > totalPages) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "tags"
        );
      }

      // CONSULTA 2: Obtener IDs de tags paginados
      const [tagIdsResult] = await connection.query(
        `SELECT id
         FROM tags tg  
         ORDER BY ${safeField} ${safeOrder}, 
         LIMIT ? OFFSET ?`,
        [pagination.limit, pagination.offset]
      );

      if (tagIdsResult.length === 0) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "tags"
        );
      }

      const tagIds = tagIdsResult.map((row) => row.id);

      // CONSULTA 3: Obtener detalles completos solo para los tags paginados
      const [rows] = await connection.query(
        `SELECT 
         id AS tag_id,
         name AS tag_name,
         description AS tag_description,
         created_at AS tag_created_at
       FROM tags 
       WHERE id IN (?)
       ORDER BY FIELD(id, ${tagIds.map((_, index) => "?").join(",")})`,
        [tagIds, ...tagIds] // Doble para el IN y el FIELD
      );

      const mappedTags =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.tagMapper.dbToDomain(row))
          : [];

      return buildPaginationResponse(
        mappedTags,
        pagination,
        total,
        totalPages,
        "tags"
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      console.error("Database error in TagDAO.findAll:", {
        page,
        limit,
        sortBy,
        sortOrder,
        error: error.message,
      });

      throw new this.DatabaseError("Error al consultar todas las etiquetas", {
        attemptedData: {
          page,
          limit,
          sortBy,
          sortOrder,
        },
        originalError: error.message,
        code: error.code,
        stack: error.stack,
      });
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

  //busca Tag por Id
  async findById({ id, externalConn = null }) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const tagIdNum = Number(id);
      if (!Number.isInteger(tagIdNum) || tagIdNum <= 0) {
        throw new ValidationError("Invalid tag id");
      }

      const [rows] = await connection.execute(
        `SELECT 
         id AS tag_id,
         name AS tag_name,
         description AS tag_description,
         created_at AS tag_created_at
         FROM tags WHERE id = ?`,
        [tagIdNum]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      const mappedTag = this.tagMapper.dbToDomain(rows[0]);
      return mappedTag;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError(
        "No se pudo consultar la etiqueta en la base de datos",
        {
          originalError: error.message,
          code: error.code,
          attemptedData: { tagId: tagIdNum },
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

  // busca tag por nombre
  async findByName({ name, externalConn = null }) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      if (!name || typeof name !== "string") {
        throw new ValidationError("Invalid tag name");
      }

      const [rows] = await connection.query(
        `SELECT 
         id AS tag_id,
          name AS tag_name,
          description AS tag_description,
          created_at AS tag_created_at
          FROM tags WHERE name = ?`,
        [name]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }
      const mappedTag = this.tagMapper.dbToDomain(rows[0]);
      return mappedTag;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError(
        "Error al consultar la etiqueta en la base de datos",
        {
          attemptedData: { name },
          originalError: error.message,
          code: error.code,
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
  //Metodos compuestos
  //Busca tags asociados a un usuario (join con user_tag)
  async findAllByUserId({
    userId,
    externalConn = null,
    page = PAGINATION_CONFIG.DEFAULT_PAGE,
    limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
    sortBy = TAG_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
  } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new ValidationError("Invalid user id");
      }

      const { safeField } = validateSortField(
        sortBy,
        TAG_SORT_FIELD,
        "TAG",
        "tag sort field"
      );

      const { safeOrder } = validateSortOrder(sortOrder, SORT_ORDER);

      const pagination = calculatePagination(
        page,
        limit,
        PAGINATION_CONFIG.MAX_LIMIT,
        PAGINATION_CONFIG.DEFAULT_PAGE,
        PAGINATION_CONFIG.DEFAULT_LIMIT
      );

      // CONSULTA 1: Contar total de tags del usuario
      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total
       FROM tags t
       INNER JOIN user_tag ut ON t.id = ut.tag_id
       WHERE ut.user_id = ?`,
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
          "tags"
        );
      }

      // CONSULTA 2: Obtener IDs de tags paginados del usuario
      const [tagIdsResult] = await connection.query(
        `SELECT t.id
       FROM tags t
       INNER JOIN user_tag ut ON t.id = ut.tag_id
       WHERE ut.user_id = ?
       ORDER BY ${safeField} ${safeOrder}, t.id ASC
       LIMIT ? OFFSET ?`,
        [userIdNum, pagination.limit, pagination.offset]
      );

      if (tagIdsResult.length === 0) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "tags"
        );
      }

      const tagIds = tagIdsResult.map((row) => row.id);

      // CONSULTA 3: Obtener detalles completos solo para los tags paginados
      const [rows] = await connection.query(
        `SELECT 
         t.id AS tag_id,
         t.name AS tag_name,
         t.description AS tag_description,
         t.created_at AS tag_created_at
       FROM tags t
       INNER JOIN user_tag ut ON t.id = ut.tag_id
       WHERE t.id IN (?) AND ut.user_id = ?
       ORDER BY FIELD(t.id, ${tagIds.map((_, index) => "?").join(",")})`,
        [tagIds, userIdNum, ...tagIds] // tagIds para IN, userIdNum para WHERE, tagIds para FIELD
      );

      const mappedTags =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.tagMapper.dbToDomain(row))
          : [];

      return buildPaginationResponse(
        mappedTags,
        pagination,
        total,
        totalPages,
        "tags"
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      console.error("Database error in TagDAO.findAllByUserId:", {
        userId,
        page,
        limit,
        sortBy,
        sortOrder,
        error: error.message,
      });

      throw new this.DatabaseError(
        "Error al consultar las etiquetas del usuario en la base de datos",
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

  // Busca tags asociadas a una tarea
  async findAllByTaskId({
    taskId,
    externalConn = null,
    page = PAGINATION_CONFIG.DEFAULT_PAGE,
    limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
    sortBy = TAG_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
  } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(taskId);
      if (!Number.isInteger(taskIdNum) || taskIdNum <= 0) {
        throw new ValidationError("Invalid task id");
      }

      const { safeField } = validateSortField(
        sortBy,
        TAG_SORT_FIELD,
        "TAG",
        "tag sort field"
      );

      const { safeOrder } = validateSortOrder(sortOrder, SORT_ORDER);

      const pagination = calculatePagination(
        page,
        limit,
        PAGINATION_CONFIG.MAX_LIMIT,
        PAGINATION_CONFIG.DEFAULT_PAGE,
        PAGINATION_CONFIG.DEFAULT_LIMIT
      );

      // CONSULTA 1: Contar total de tags de la tarea
      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total
       FROM tags t
       INNER JOIN task_tag tt ON t.id = tt.tag_id
       WHERE tt.task_id = ?`,
        [taskIdNum]
      );

      const total = Number(totalRows[0]?.total) || 0;
      const totalPages = calculateTotalPages(total, pagination.limit);

      if (total === 0 || pagination.page > totalPages) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "tags"
        );
      }

      // CONSULTA 2: Obtener IDs de tags paginados de la tarea
      const [tagIdsResult] = await connection.query(
        `SELECT t.id
       FROM tags t
       INNER JOIN task_tag tt ON t.id = tt.tag_id
       WHERE tt.task_id = ?
       ORDER BY ${safeField} ${safeOrder}, t.id ASC
       LIMIT ? OFFSET ?`,
        [taskIdNum, pagination.limit, pagination.offset]
      );

      if (tagIdsResult.length === 0) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "tags"
        );
      }

      const tagIds = tagIdsResult.map((row) => row.id);

      // CONSULTA 3: Obtener detalles completos solo para los tags paginados
      const [rows] = await connection.query(
        `SELECT 
         t.id AS tag_id,
         t.name AS tag_name,
         t.description AS tag_description,
         t.created_at AS tag_created_at
       FROM tags t
       INNER JOIN task_tag tt ON t.id = tt.tag_id
       WHERE t.id IN (?) AND tt.task_id = ?
       ORDER BY FIELD(t.id, ${tagIds.map((_, index) => "?").join(",")})`,
        [tagIds, taskIdNum, ...tagIds] // tagIds para IN, taskIdNum para WHERE, tagIds para FIELD
      );

      const mappedTags =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.tagMapper.dbToDomain(row))
          : [];

      return buildPaginationResponse(
        mappedTags,
        pagination,
        total,
        totalPages,
        "tags"
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error("Database error in TagDAO.findAllByTaskId:", {
        taskId,
        page,
        limit,
        sortBy,
        sortOrder,
        error: error.message,
      });

      throw new this.DatabaseError(
        "Error al consultar las etiquetas de la tarea en la base de datos",
        {
          attemptedData: {
            taskId,
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

module.exports = TagDAO;
