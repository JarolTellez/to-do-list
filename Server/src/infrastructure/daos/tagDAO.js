const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");

const { SORT_ORDER, TAG_SORT_FIELD } = require("../constants/sortConstants");

class TagDAO extends BaseDatabaseHandler {
  constructor({
    tagMapper,
    connectionDB,
    errorFactory,
    sortValidator
  }) {
    super(connectionDB);
    this.tagMapper = tagMapper;
    this.errorFactory = errorFactory;
    this.sortValidator = sortValidator;
  }

  async create(tag, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        "INSERT INTO tags (name, user_id) VALUES(?, ?)",
        [tag.name, tag.userId]
      );
      const insertedId = result.insertId;

      const createdTag = this.findById(insertedId);

      return createdTag;
    } catch (error) {
      // Duplicated error
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw this.errorFactory.createConflictError(
          "A tag with this name already exists for this user ",
          { name: tag.name, userId: tag.userId }
        );
      }

      throw this.errorFactory.createDatabaseError("Failed to create tag", {
        originalError: error.message,
        code: error.code,
        attemptedData: { name: tag.name, userId: tag.userId },
        context: "tagDAO - create method",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
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
      if(result.affectedRows ===0){
        return null;
      }
      return tag;
    } catch (error) {
      // Error de duplicado al actualizar
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw this.errorFactory.createConflictError(
          "Already exist a tag with this name",
          {
            attemptedData: { tagName: tag.name },
          }
        );
      }

      throw this.errorFactory.createDatabaseError("Failed to update tag", {
        originalError: error.message,
        code: error.code,
        attemptedData: { tagId: tag.id, tagName: tag.name },
        context: "tagDAO - update method",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
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
        throw this.errorFactory.createConflictError(
          "No se puede eliminar la etiqueta porque está siendo utilizada",
          { attemptedData: { tagId: id } }
        );
      }

      throw this.errorFactory.createDatabaseError(
        "Error al eliminar la etiqueta de la base de datos",
        {
          attemptedData: { tagId: id },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  //obtiene todas las etiquetas
  async findAll({
    externalConn = null,
    sortBy = TAG_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
    limit = null,
    offset = null,
  } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const { safeField } = this.sortValidator.validateSortField(
        sortBy,
        TAG_SORT_FIELD,
        "TAG",
        "tag sort field"
      );

      const { safeOrder } = this.sortValidator.validateSortOrder(sortOrder, SORT_ORDER);

      // CONSULTA: Obtener tags con limite y offset
      const [rows] = await connection.query(
        `SELECT 
       id AS tag_id,
       name AS tag_name,
       description AS tag_description,
       created_at AS tag_created_at
     FROM tags 
     ORDER BY ${safeField} ${safeOrder}
     ${limit !== null ? "LIMIT ?" : ""} 
     ${offset !== null ? "OFFSET ?" : ""}`,
        [limit, offset].filter((param) => param !== null)
      );

      const mappedTags =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.tagMapper.dbToDomain(row))
          : [];

      return mappedTags;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve all tags",
        {
          attemptedData: {
            sortBy,
            sortOrder,
            limit,
            offset,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "tagDAO: findAll method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // Cuenta todos los tags
  async countAll(externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total FROM tags`
      );
      return Number(totalRows[0]?.total) || 0;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError("Failed to count all tags", {
        originalError: error.message,
        code: error.code,
        stack: error.stack,
        context: "tagDAO: countAll method",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  //busca Tag por Id
  async findById(id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const tagIdNum = Number(id);
      if (!Number.isInteger(tagIdNum) || tagIdNum <= 0) {
        throw this.errorFactory.createValidationError("Invalid tag id");
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
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve tag by id",
        {
          originalError: error.message,
          code: error.code,
          attemptedData: { tagId: tagIdNum },
          context: "tagDAO - findById method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // busca tag por nombre
  async findByName(name, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      if (!name || typeof name !== "string") {
        throw this.errorFactory.createValidationError("Invalid tag name");
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
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve tag by name",
        {
          attemptedData: { name },
          originalError: error.message,
          code: error.code,
          context: "tagDAO - findByName method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
  //Metodos compuestos
  // Busca tags asociados a un usuario (join con user_tag)
  async findAllByUserId({
    userId,
    externalConn = null,
    sortBy = TAG_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
    limit = null,
    offset = null,
  } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw this.errorFactory.createValidationError("Invalid user id");
      }

      const { safeField } = this.sortValidator.validateSortField(
        sortBy,
        TAG_SORT_FIELD,
        "TAG",
        "tag sort field"
      );

      const { safeOrder } = this.sortValidator.validateSortOrder(sortOrder, SORT_ORDER);

      // CONSULTA: Obtener tags del usuario
      const [rows] = await connection.query(
        `SELECT 
       t.id AS tag_id,
       t.name AS tag_name,
       t.description AS tag_description,
       t.created_at AS tag_created_at
     FROM tags t
     INNER JOIN user_tag ut ON t.id = ut.tag_id
     WHERE ut.user_id = ?
     ORDER BY ${safeField} ${safeOrder}, t.id ASC
     ${limit !== null ? "LIMIT ?" : ""} 
     ${offset !== null ? "OFFSET ?" : ""}`,
        [userIdNum, limit, offset].filter((param) => param !== null)
      );

      const mappedTags =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.tagMapper.dbToDomain(row))
          : [];

      return mappedTags;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve tags by user id",
        {
          attemptedData: {
            userId,
            sortBy,
            sortOrder,
            limit,
            offset,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "tagDAO: findAllByUserId method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // Busca tags asociadas a una tarea
  async findAllByTaskId({
    taskId,
    externalConn = null,
    sortBy = TAG_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
    limit = null,
    offset = null,
  } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(taskId);
      if (!Number.isInteger(taskIdNum) || taskIdNum <= 0) {
        throw this.errorFactory.createValidationError("Invalid task id");
      }

      const { safeField } = this.sortValidator.validateSortField(
        sortBy,
        TAG_SORT_FIELD,
        "TAG",
        "tag sort field"
      );

      const { safeOrder } = this.sortValidator.validateSortOrder(sortOrder, SORT_ORDER);

      // CONSULTA: Obtener tags de la tarea
      const [rows] = await connection.query(
        `SELECT 
       t.id AS tag_id,
       t.name AS tag_name,
       t.description AS tag_description,
       t.created_at AS tag_created_at
     FROM tags t
     INNER JOIN task_tag tt ON t.id = tt.tag_id
     WHERE tt.task_id = ?
     ORDER BY ${safeField} ${safeOrder}, t.id ASC
     ${limit !== null ? "LIMIT ?" : ""} 
     ${offset !== null ? "OFFSET ?" : ""}`,
        [taskIdNum, limit, offset].filter((param) => param !== null)
      );

      const mappedTags =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.tagMapper.dbToDomain(row))
          : [];

      return mappedTags;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve tags by task id",
        {
          attemptedData: {
            taskId,
            sortBy,
            sortOrder,
            limit,
            offset,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "tagDAO: findAllByTaskId method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // Contar tags por usuario
  async countAllByUserId({ userId, externalConn = null } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw this.errorFactory.createValidationError("Invalid user id");
      }

      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total
     FROM tags t
     INNER JOIN user_tag ut ON t.id = ut.tag_id
     WHERE ut.user_id = ?`,
        [userIdNum]
      );

      return Number(totalRows[0]?.total) || 0;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to count tags by user id",
        {
          attemptedData: { userId },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "tagDAO: countAllByUserId method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // Contar tags por tarea
  async countAllByTaskId({ taskId, externalConn = null } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(taskId);
      if (!Number.isInteger(taskIdNum) || taskIdNum <= 0) {
        throw this.errorFactory.createValidationError("Invalid task id");
      }

      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total
     FROM tags t
     INNER JOIN task_tag tt ON t.id = tt.tag_id
     WHERE tt.task_id = ?`,
        [taskIdNum]
      );

      return Number(totalRows[0]?.total) || 0;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to count tags by task id",
        {
          attemptedData: { taskId },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "tagDAO: countAllByTaskId method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
}

module.exports = TagDAO;
