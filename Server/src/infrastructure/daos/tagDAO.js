const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");

const { SORT_ORDER, TAG_SORT_FIELD } = require("../constants/sortConstants");
const{MAPPER_TYPES} = require('../constants/mapperConstants');

class TagDAO extends BaseDatabaseHandler {
  constructor({ tagMapper, connectionDB, errorFactory, inputValidator }) {
    super(connectionDB);
    this.tagMapper = tagMapper;
    this.errorFactory = errorFactory;
    this.inputValidator = inputValidator;
  }

  async create(tag, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        "INSERT INTO tags (name, user_id) VALUES(?, ?)",
        [tag.name, tag.userId]
      );
      const insertedId = result.insertId;

      const createdTag = await this.findById(insertedId, connection);

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
      if (result.affectedRows === 0) {
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
      const tagIdNum = this.inputValidator.validateId(id, "tag id");
      const [result] = await connection.execute(
        "DELETE FROM tags WHERE id = ?",
        [tagIdNum]
      );

      return result.affectedRows > 0;
    } catch (error) {
      // Manejar error de clave foranea
      if (error.code === "ER_ROW_IS_REFERENCED" || error.errno === 1451) {
        throw this.errorFactory.createConflictError(
          "Cannot delete the tag because it is currently in use",
          { attemptedData: { tagId: id } }
        );
      }

      throw this.errorFactory.createDatabaseError("Failed to delete tag", {
        attemptedData: { tagId: id },
        originalError: error.message,
        code: error.code,
        context: "tagDAO - delete method",
      });
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
      const baseQuery = `SELECT 
       id AS tag_id,
       name AS tag_name,
       description AS tag_description,
       created_at AS tag_created_at
       FROM tags`;

      return await this._executeQuery({
        connection,
        baseQuery,
        sortBy,
        sortOrder,
        sortConstants: TAG_SORT_FIELD,
        entityType: "TAG",
        entityName: "tag",
        limit,
        offset,
        mapper: this.tagMapper.dbToDomain,
      });
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

  //busca Tag por Id
  async findById(id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const tagIdNum = this.inputValidator.validateId(id, "tag id");

      const baseQuery = `SELECT 
       id AS tag_id,
       name AS tag_name,
       description AS tag_description,
       created_at AS tag_created_at
       FROM tags WHERE id = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [tagIdNum],
        mapper: this.tagMapper.dbToDomain,
      });

      return result.length > 0 ? result[0] : null;
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

       const baseQuery = `SELECT 
       id AS tag_id,
       name AS tag_name,
       description AS tag_description,
       created_at AS tag_created_at
       FROM tags WHERE name = ?`;

    const result = await this._executeQuery({
      connection,
      baseQuery,
      params: [name],
      mapper: this.tagMapper.dbToDomain
    });

    return result.length > 0 ? result[0] : null;
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
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      const baseQuery = `
      SELECT 
        t.id AS tag_id,
        t.name AS tag_name,
        t.description AS tag_description,
        t.created_at AS tag_created_at
      FROM tags t
      INNER JOIN user_tag ut ON t.id = ut.tag_id
      WHERE ut.user_id = ?`;

      return await this._executeQuery({
        connection,
        baseQuery,
        params: [userIdNum],
        sortBy,
        sortOrder,
        sortConstants: TAG_SORT_FIELD,
        entityType: "TAG",
        entityName: "tag",
        limit,
        offset,
        mapper: this.tagMapper.dbToDomain,
      });
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
      const taskIdNum = this.inputValidator.validateId(taskId, "task id");

      const baseQuery = `
      SELECT 
        t.id AS tag_id,
        t.name AS tag_name,
        t.description AS tag_description,
        t.created_at AS tag_created_at
      FROM tags t
      INNER JOIN task_tag tt ON t.id = tt.tag_id
      WHERE tt.task_id = ?`;

      return await this._executeQuery({
        connection,
        baseQuery,
        params: [taskIdNum],
        sortBy,
        sortOrder,
        sortConstants: TAG_SORT_FIELD,
        entityType: "TAG",
        entityName: "tag",
        limit,
        offset,
        mapper: this.tagMapper.dbToDomain,
      });
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

  // Cuenta todos los tags
  async countAll(externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const baseQuery = `SELECT COUNT(*) AS total FROM tags`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        mapper: null,
      });
      return Number(result[0]?.total) || 0;
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
  // Contar tags por usuario
  async countAllByUserId({ userId, externalConn = null } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      const baseQuery = `SELECT COUNT(*) AS total
        FROM tags t
        INNER JOIN user_tag ut ON t.id = ut.tag_id
        WHERE ut.user_id = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [userIdNum],
        mapper: null,
      });

      return Number(result[0]?.total) || 0;
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
      const taskIdNum = this.inputValidator.validateId(taskId, "task id");

      const baseQuery = `SELECT COUNT(*) AS total
        FROM tags t
        INNER JOIN task_tag tt ON t.id = tt.tag_id
        WHERE tt.task_id = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [taskIdNum],
        mapper: null,
      });

      return Number(result[0]?.total) || 0;
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

  // async _executeTagQuery({
  //   connection,
  //   baseQuery,
  //   params = [],
  //   sortBy = TAG_SORT_FIELD.CREATED_AT,
  //   sortOrder = SORT_ORDER.DESC,

  // }) {
  //   const { safeField } = this.inputValidator.validateSortField(
  //     sortBy,
  //     TAG_SORT_FIELD,
  //     "TAG",
  //     "tag sort field"
  //   );
  //   const { safeOrder } = this.inputValidator.validateSortOrder(
  //     sortOrder,
  //     SORT_ORDER
  //   );

  //   let query = `${baseQuery} ORDER BY ${safeField} ${safeOrder}`;
  //   const queryParams = [...params];
  //   if (limit !== null) query += " LIMIT ?";
  //   if (offset !== null) query += " OFFSET ?";
  //   if (limit !== null) queryParams.push(limit);
  //   if (offset !== null) queryParams.push(offset);

  //   const [rows] = await connection.query(query, queryParams);

  //   return Array.isArray(rows) && rows.length > 0
  //     ? rows.map((row) => this.tagMapper.dbToDomain(row))
  //     : [];
  // }
}

module.exports = TagDAO;
