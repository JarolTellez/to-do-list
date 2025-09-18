const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");
const PAGINATION_CONFIG = require("../config/pagination");
const {
  SORT_ORDER,
  TASK_TAG_SORT_FIELD,
} = require("../constants/sortConstants");

class TaskTagDAO extends BaseDatabaseHandler {
  constructor({ taskTagMapper, errorFactory, inputValidator }) {
    super(connectionDB);
    this.taskTagMapper = taskTagMapper;
    this.errorFactory = errorFactory;
    this.inputValidator = inputValidator;
  }

  async create(taskTag, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        "INSERT INTO task_tag (task_id, tag_id) VALUES (?, ?)",
        [taskTag.taskId, taskTag.tagId]
      );

      const actualTaskTag = await this.findById(result.insertId, connection);
      return actualTaskTag;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw this.errorFactory.createConflictError(
          "This task already has this tag assigned",
          { attemptedData: { taskId, tagId } }
        );
      }

      if (error.code === "ER_NO_REFERENCED_ROW" || error.errno === 1452) {
        throw this.errorFactory.createConflictError(
          "the task or tag does not exist",
          {
            attemptedData: { taskId, tagId },
          }
        );
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to create taskTag relationShip",
        {
          attemptedData: { taskId, tagId },
          originalError: error.message,
          code: error.code,
          context: "taskTag DAO - create method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async delete(id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskTagIdNum = this.inputValidator.validateId(id, "taskTag id");

      const [result] = await connection.execute(
        "DELETE FROM task_tag WHERE id = ?",
        [taskTagIdNum]
      );

      return result.affectedRows > 0;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to delete taskTag relationship",
        {
          attemptedData: { taskTagId: id },
          originalError: error.message,
          code: error.code,
          context: "taskTag DAO - delete by id method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  //eliminar una relacion especifica por taskId y tagId
  async deleteByTaskIdAndTagId(taskId, tagId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(taskId);
      const tagIdNum = Number(tagId);

      if (Number.isInteger(taskIdNum) || taskIdNum <= 0) {
        throw this.errorFactory.createValidationError("Invalid task id");
      }

      if (Number.isInteger(tagIdNum) || tagIdNum <= 0) {
        throw this.errorFactory.createValidationError("Invalid tag id");
      }
      const [result] = connection.execute(
        `DELETE FROM tasg_tag WHERE task_id = ? AND tag_id =?`,
        [taskIdNum, tagIdNum]
      );
      return result.affectedRows > 0;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      throw this.errorFactory.createDatabaseError(
        "Failed to delete taskTag relationship",
        {
          attemptedData: { taskTagId: id },
          originalError: error.message,
          code: error.code,
          context: "taskTagDAO - delete by taskId and userId",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
  // Elimina todas las relaciones de TareaEtiqueta por taskId para eliminar todas las etiquetas de una tarea
  async deleteAllByTaskId(taskId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(taskId);

      if (Number.isInteger(taskIdNum) || taskIdNum <= 0) {
        throw this.errorFactory.createValidationError("Invalid task id");
      }

      const [result] = await connection.execute(
        "DELETE FROM task_tag WHERE task_id = ?",
        [taskIdNum]
      );
      return result.affectedRows > 0;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      throw this.errorFactory.createDatabaseError(
        "Failed to delete all taskTag relationship for the specific task",
        {
          attemptedData: { taskTagId: id },
          originalError: error.message,
          code: error.code,
          context: "taskTagDAO - bulk deletion by taskId",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findById(id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskTagIdNum = this.inputValidator.validateId(id, "taskTag id");

      const [rows] = await connection.execute(
        `SELECT 
         id AS  task_tag_id,
         task_id,
         tag_id,
         created_at AS task_tag_created_at
         FROM task_tag
        WHERE id = ?`,
        [taskTagIdNum]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      const mappedTaskTag = this.taskTagMapper.dbToDomain(rows[0]);
      return mappedTaskTag;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve taskTag relationShip by id",
        {
          originalError: error.message,
          code: error.code,
          attemptedData: { taskTagId: taskTagIdNum },
          context: "taskTagDAO - find by id",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findAllByTaskId({
    taskId,
    externalConn = null,
    page = PAGINATION_CONFIG.DEFAULT_PAGE,
    limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
    sortBy = TASK_TAG_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
  } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = this.inputValidator.validateId(taskId, "task id");

      const { safeField } = this.inputValidator.validateSortField(
        sortBy,
        TASK_TAG_SORT_FIELD,
        "TASK_TAG",
        "task tag sort field"
      );

      const { safeOrder } = this.inputValidator.validateSortOrder(sortOrder, SORT_ORDER);

      const queryParams = [taskIdNum];
      if (limit !== null) queryParams.push(limit);
      if (offset !== null) queryParams.push(offset);
      const [rows] = await connection.query(
        `SELECT 
         tt.id AS task_tag_id,
         tt.task_id,
         tt.tag_id,
         tt.created_at AS task_tag_created_at
       FROM task_tag tt 
         WHERE tt.task_id = ?
       ORDER BY ${safeField} ${safeOrder}, tt.id ASC
       LIMIT ? OFFSET ?`,
        queryParams
      );

      const mappedTaskTags =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.taskTagMapper.dbToDomain(row))
          : [];

      return mappedTaskTags;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve all taskTag for specific task",
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
          context: "taskTagDAO - find all by taskId",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findAllByTagId({
    tagId,
    externalConn = null,
    page = PAGINATION_CONFIG.DEFAULT_PAGE,
    limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
    sortBy = TASK_TAG_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
  } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const tagIdNum = this.inputValidator.validateId(tagId, "tag id");

      const { safeField } = this.inputValidator.validateSortField(
        sortBy,
        TASK_TAG_SORT_FIELD,
        "TASK_TAG",
        "task tag sort field"
      );

      const { safeOrder } = this.inputValidator.validateSortOrder(sortOrder, SORT_ORDER);

      const queryParams = [tagIdNum];
      if (limit !== null) queryParams.push(limit);
      if (offset !== null) queryParams.push(offset);

      const [rows] = await connection.query(
        `SELECT 
         tt.id AS task_tag_id,
         tt.task_id,
         tt.tag_id,
         tt.created_at AS task_tag_created_at
       FROM task_tag tt 
      WHERE tt.tag_id = ?
       ORDER BY ${safeField} ${safeOrder}, tt.id ASC
       LIMIT ? OFFSET ?`,
        queryParams
      );

      const mappedTaskTags =
        Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => this.taskTagMapper.dbToDomain(row))
          : [];

      return mappedTaskTags;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve all taskTag for specific tag",
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
          context: "taskTagDAO - find all by tagId",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findByTaskIdAndTagId(taskId, tagId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = this.inputValidator.validateId(taskId, "task id");

      const tagIdNum = this.inputValidator.validateId(tagId, "tag id");

      const [rows] = await connection.execute(
        `SELECT 
         tt.id AS task_tag_id,
         tt.task_id,
         tt.tag_id,
         tt.created_at AS task_tag_created_at
       FROM task_tag tt 
       WHERE tt.task_id = ? AND tt.tag_id = ?`,
        [taskIdNum, tagIdNum]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.taskTagMapper.dbToDomain(rows[0]);
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve specific taskTag ",
        {
          attemptedData: {
            taskId,
            tagId,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "taskTagDAO - find by taskId and tagId",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
}

module.exports = TaskTagDAO;
