const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");
const PAGINATION_CONFIG = require("../config/pagination");
const {
  DatabaseError,
  ConflictError,
  ValidationError,
} = require("../../utils/appErrors");

const {validateSortField, validateSortOrder}= require('../utils/validation/sortValidator');
const { calculatePagination,calculateTotalPages} = require('../utils/pagination');

const { SORT_ORDER, TAG_SORT_FIELD } = require("../constants/sortConstants");

class TagDAO extends BaseDatabaseHandler {
  constructor({ tagMapper, connectionDB }) {
    super(connectionDB);
    this.tagMapper = tagMapper;
  }

  async create({tag, externalConn = null}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        "INSERT INTO tags (name, user_id) VALUES(?, ?)",
        [tag.name, tag.userId]
      );
      tag.id = result.insertId;
      return tag;
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
      await this.releaseConnection(connection, isExternal);
    }
  }

  async update({tag, externalConn = null}) {
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
      await this.releaseConnection(connection, isExternal);
    }
  }

  async delete({id, externalConn = null}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        "DELETE FROM tags WHERE id = ?",
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      // Manejar error de clave foránea
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
      await this.releaseConnection(connection, isExternal);
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
    // Validaciones con utils
    validateSortField(sortBy, TAG_SORT_FIELD, 'tag sort field');
    validateSortOrder(sortOrder, SORT_ORDER);

    const pagination = calculatePagination(
      page, 
      limit, 
      PAGINATION_CONFIG.MAX_LIMIT,
      PAGINATION_CONFIG.DEFAULT_PAGE,
      PAGINATION_CONFIG.DEFAULT_LIMIT
    );

    // Consulta del total
    const [totalRows] = await connection.execute(`SELECT COUNT(*) as total FROM tags`);
    const total = Number(totalRows[0]?.total) || 0;
    const totalPages = calculateTotalPages(total, pagination.limit);

    
    if (total === 0 || pagination.page > totalPages) {
      return buildPaginationResponse([], pagination, 0, 0, 'tags');
    }

    
    const [rows] = await connection.query(
      `SELECT 
         id AS tag_id,
         name AS tag_name,
         description AS tag_description,
         created_at AS tag_created_at
       FROM tags 
       ORDER BY ${sortBy} ${sortOrder}, id ASC
       LIMIT ? OFFSET ?`,
      [pagination.limit, pagination.offset]
    );

    const mappedTags = Array.isArray(rows)
      ? rows.map((row) => this.tagMapper.dbToDomain(row))
      : [];

    return buildPaginationResponse(mappedTags, pagination, total, totalPages,'tags');

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError("Error al consultar todas las etiquetas", {
      originalError: error.message,
      code: error.code,
    });
  } finally {
    await this.releaseConnection(connection, isExternal);
  }
}

  //busca Tag por Id
  async findById({id, externalConn = null}) {
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
      // para preservar los tipos de errores y que no se conviertan en DatabaseError
      if (error instanceof ValidationError) {
        throw error; // Preservar error de validacion
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
      await this.releaseConnection(connection, isExternal);
    }
  }

  // busca tag por nombre
  async findByName({name, externalConn = null}) {
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
        throw error; // Preservar error de validacion
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
      await this.releaseConnection(connection, isExternal);
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
    }
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new ValidationError("Invalid user id");
      }

      // Validar parametros de ordenamiento, que existan en las constantes
      if (!Object.values(TAG_SORT_FIELD).includes(sortBy)) {
        throw new ValidationError(
          `Invalid sort field. Valid values: ${Object.values(
            TAG_SORT_FIELD
          ).join(", ")}`
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

      // Consulta del total de registros
      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) as total
        FROM tags t
        INNER JOIN user_tag ut ON t.id = ut.tag_id
        WHERE ut.user_id = ?
          `,
        [userIdNum]
      );
      const total = Number(totalRows[0]?.total) || 0;
      const totalPages = total > 0 ? Math.ceil(total / limitNum) : 0;

      // Si no hay datos retornar de una vez
      if (total === 0 || pageNum > totalPages) {
        return {
          tags: [],
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
        `
          SELECT 
          t.id AS tag_id,
	      	t.name AS tag_name,
          t.description AS tag_description,
	      	t.created_at AS tag_created_at
          FROM tags t 
          INNER JOIN user_tag ut ON t.id=ut.tag_id 
          WHERE ut.user_id = ?
          ORDER BY t.${sortBy} ${sortOrder}
          LIMIT ? OFFSET ?`,
        [userIdNum, limitNum, offset]
      );

      const mappedTags = Array.isArray(rows)
        ? rows.map((row) => this.tagMapper.dbToDomain(row))
        : [];

      return {
        tags: mappedTags,
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
        throw error; // Preservar error de validacion
      }

      throw new DatabaseError(
        "Error al consultar las userTag en la base de datos",
        {
          attemptedData: {
            userIdNum,
            originalError: error.message,
            code: error.code,
          },
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
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
    }
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(taskId);
      if (!Number.isInteger(taskIdNum) || taskIdNum <= 0) {
        throw new ValidationError("Invalid task id");
      }

      // Validar parametros de ordenamiento, que existan en las constantes
      if (!Object.values(TAG_SORT_FIELD).includes(sortBy)) {
        throw new ValidationError(
          `Invalid sort field. Valid values: ${Object.values(
            TAG_SORT_FIELD
          ).join(", ")}`
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

      // Consulta del total de registros
      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) as total
FROM tags t
INNER JOIN task_tag tt ON t.id = tt.tag_id
WHERE tt.task_id = ?
 `,[taskIdNum]
      );
      const total = Number(totalRows[0]?.total) || 0;
      const totalPages = total > 0 ? Math.ceil(total / limitNum) : 0;

      // Si no hay datos retornar de una vez
      if (total === 0 || pageNum > totalPages) {
        return {
          tags: [],
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
        `SELECT 
          t.id AS tag_id,
	      	t.name AS tag_name,
          t.description AS tag_description,
	      	t.created_at AS tag_created_at
          FROM tags t 
          INNER JOIN task_tag tt ON t.id=tt.tag_id 
          WHERE tt.task_id = ?
          ORDER BY t.${sortBy} ${sortOrder}
          LIMIT ? OFFSET ?`,
        [taskIdNum, limitNum, offset]
      );

      const mappedTags = Array.isArray(rows)
        ? rows.map((row) => this.tagMapper.dbToDomain(row))
        : [];

      return {
        tags: mappedTags,
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
        throw error; // Preservar error de validacion
      }

      throw new DatabaseError(
        "Error al consultar las userTag en la base de datos",
        {
          attemptedData: {
            taskId: taskIdNum,
            originalError: error.message,
            code: error.code,
          },
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }
}

module.exports = TagDAO;
