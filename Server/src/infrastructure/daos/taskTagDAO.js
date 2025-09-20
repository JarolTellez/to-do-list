const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");
const PAGINATION_CONFIG = require("../config/pagination");
const {
  SORT_ORDER,
  TASK_TAG_SORT_FIELD,
} = require("../constants/sortConstants");

class TaskTagDAO extends BaseDatabaseHandler {
  constructor({ connectionDB, taskTagMapper, errorFactory, inputValidator }) {
    super(connectionDB);
    this.taskTagMapper = taskTagMapper;
    this.errorFactory = errorFactory;
    this.inputValidator = inputValidator;
  }
/**
 * Creates a ne
 * @param {*} taskTag 
 * @param {*} externalConn 
 * @returns 
 */
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
          { attemptedData: {  taskId: taskTag.taskId, tagId: taskTag.tagId } }
        );
      }

      if (error.code === "ER_NO_REFERENCED_ROW" || error.errno === 1452) {
        throw this.errorFactory.createConflictError(
          "the task or tag does not exist",
          {
            attemptedData: { taskId: taskTag.taskId, tagId: taskTag.tagId  },
          }
        );
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to create taskTag relationShip",
        {
          attemptedData: { taskId: taskTag.taskId, tagId: taskTag.tagId },
          originalError: error.message,
          code: error.code,
          context: "taskTagDAO.create",
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
          attemptedData: { taskTagId:taskTagIdNum },
          originalError: error.message,
          code: error.code,
          context: "taskTagDAO.delete",
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
      const taskIdNum = this.inputValidator.validateId(taskId, "task id");
      const tagIdNum = this.inputValidator.validateId(tagId, "tag id");

      const [result] = await connection.execute(
        `DELETE FROM task_tag WHERE task_id = ? AND tag_id =?`,
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
          attemptedData: { taskId: taskIdNum, tagId: tagIdNum },
          originalError: error.message,
          code: error.code,
          context: "taskTagDAO.deleteByTaskIdAndTagId",
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
      const taskIdNum =this.inputValidator.validateId(taskId, "task id");

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
          attemptedData: { taskId: taskIdNum },
          originalError: error.message,
          code: error.code,
          context: "taskTagDAO.deleteAllByTaskId",
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

      const baseQuery = `SELECT 
         tt.id AS  task_tag_id,
         tt.task_id,
         tt.tag_id,
         tt.created_at AS task_tag_created_at
         FROM task_tag tt
        WHERE id = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [taskTagIdNum],
        mapper: this.taskTagMapper.dbToDomain,
      });

      return result.length > 0 ? result[0] : null;
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
          context: "taskTagDAO.findById",
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
    offset = null,
    limit = null,
    sortBy = TASK_TAG_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
  } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = this.inputValidator.validateId(taskId, "task id");

      const baseQuery = `SELECT 
         tt.id AS task_tag_id,
         tt.task_id,
         tt.tag_id,
         tt.created_at AS task_tag_created_at
       FROM task_tag tt 
         WHERE tt.task_id = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [taskIdNum],
        sortBy,
        sortOrder,
        sortConstants: TASK_TAG_SORT_FIELD,
        entityType: "TASK_TAG",
        entityName: "taskTag",
        limit,
        offset,
        mapper: this.taskTagMapper.dbToDomain,
      });
      return result;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve all taskTag for specific task",
        {
          attemptedData: {
            taskId: taskIdNum,
            offset,
            limit,
            sortBy,
            sortOrder,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "taskTagDAO.findAllByTaskId",
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
    offset = null,
    limit = null,
    sortBy = TASK_TAG_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
  } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const tagIdNum = this.inputValidator.validateId(tagId, "tag id");
      const baseQuery = `SELECT 
         tt.id AS task_tag_id,
         tt.task_id,
         tt.tag_id,
         tt.created_at AS task_tag_created_at
       FROM task_tag tt 
      WHERE tt.tag_id = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [tagIdNum],
        sortBy,
        sortOrder,
        sortConstants: TASK_TAG_SORT_FIELD,
        entityType: "TASK_TAG",
        entityName: "taskTag",
        limit,
        offset,
        mapper: this.taskTagMapper.dbToDomain,
      });
      return result;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve all taskTag for specific tag",
        {
          attemptedData: {
            tagId:tagIdNum,
            offset,
            limit,
            sortBy,
            sortOrder,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "taskTagDAO.findAllByTagId",
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

      const baseQuery = `SELECT 
         tt.id AS task_tag_id,
         tt.task_id,
         tt.tag_id,
         tt.created_at AS task_tag_created_at
       FROM task_tag tt 
       WHERE tt.task_id = ? AND tt.tag_id = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [taskIdNum, tagIdNum],
        mapper: this.taskTagMapper.dbToDomain,
      });
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve specific taskTag ",
        {
          attemptedData: {
            taskId:taskIdNum,
            tagId: tagIdNum,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "taskTagDAO.findByTaskIdAndTagId",
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
