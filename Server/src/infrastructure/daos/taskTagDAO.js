const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");
const PAGINATION_CONFIG = require("../config/pagination");
const {
  SORT_ORDER,
  TASK_TAG_SORT_FIELD,
} = require("../constants/sortConstants");

class TaskTagDAO extends BaseDatabaseHandler {
  constructor({taskTagMapper,connectionDB, errorFactory, inputValidator }) {
    super(connectionDB);
    this.taskTagMapper = taskTagMapper;
    this.errorFactory = errorFactory;
    this.inputValidator = inputValidator;
  }

  /**
   * Creates a new task-tag relationship in the database
   * @param {TaskTag} taskTag - TaskTag domain entity to persist
   * @param {number} taskTag.taskId - Id of the task to associate
   * @param {number} taskTag.tagId - Id of the tag to associate
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<TaskTag>} Persisted TaskTag entity with assigned id and timestamps
   * @throws {ConflictError} When the task-tag relationship already exists or referenced entities don't exist
   * @throws {ValidationError} If input validation fails
   * @throws {DatabaseError} On database operation failure
   */
  async create(taskTag, externalConn = null) {
    // Get database connection (new or provided external for transactions)
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
          { attemptedData: { taskId: taskTag.taskId, tagId: taskTag.tagId } }
        );
      }

      if (error.code === "ER_NO_REFERENCED_ROW" || error.errno === 1452) {
        throw this.errorFactory.createConflictError(
          "the task or tag does not exist",
          {
            attemptedData: { taskId: taskTag.taskId, tagId: taskTag.tagId },
          }
        );
      }
      // Handle all other database errors
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
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Deletes a task-tag relationship by its Id
   * @param {number} id - Id of the task-tag relationship to delete
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<boolean>} True if the relationship was found and deleted, false otherwise
   * @throws {ValidationError} If the task-tag Id is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async delete(id, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskTagIdNum = this.inputValidator.validateId(id, "taskTag id");

      const [result] = await connection.execute(
        "DELETE FROM task_tag WHERE id = ?",
        [taskTagIdNum]
      );

      return result.affectedRows > 0;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to delete taskTag relationship",
        {
          attemptedData: { taskTagId: taskTagIdNum },
          originalError: error.message,
          code: error.code,
          context: "taskTagDAO.delete",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Deletes a specific task-tag relationship by task Id and tag Id
   * @param {number} taskId - Id of the task
   * @param {number} tagId - Id of the tag
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<boolean>} True if the relationship was found and deleted, false otherwise
   * @throws {ValidationError} If the task Id or tag Id is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async deleteByTaskIdAndTagId(taskId, tagId, externalConn = null) {
    // Get database connection (new or provided external for transactions)
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
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      // Handle all other database errors
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
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
  /**
   * Deletes all task-tag relationships for a specific task
   * @param {number} taskId - Id of the task whose tags will be removed
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<boolean>} True if any relationships were deleted, false otherwise
   * @throws {ValidationError} If the task Id is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async deleteAllByTaskId(taskId, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = this.inputValidator.validateId(taskId, "task id");

      const [result] = await connection.execute(
        "DELETE FROM task_tag WHERE task_id = ?",
        [taskIdNum]
      );
      return result.affectedRows > 0;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      // Handle all other database errors
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
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Retrieves a task-tag relationship by its Id
   * @param {number} id - Id of the task-tag relationship to find
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<TaskTag|null>} TaskTag entity if found, null otherwise
   * @throws {ValidationError} If the task-tag Id is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findById(id, externalConn = null) {
    // Get database connection (new or provided external for transactions)
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
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      // Handle all other database errors
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
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Retrieves all task-tag relationships for a specific task with optional pagination and sorting
   * @param {Object} options - Configuration options for the query
   * @param {number} options.taskId - Id of the task whose tags to retrieve
   * @param {import('mysql2').Connection} [options.externalConn=null] - External database connection for transactions
   * @param {number} [options.offset=null] - Number of records to skip for pagination
   * @param {number} [options.limit=null] - Maximum number of records to return
   * @param {string} [options.sortBy=TASK_TAG_SORT_FIELD.CREATED_AT] - Field to sort results by
   * @param {string} [options.sortOrder=SORT_ORDER.DESC] - Sort order (ASC or DESC)
   * @returns {Promise<Array<TaskTag>>} Array of TaskTag entities
   * @throws {ValidationError} If the task Id is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findAllByTaskId({
    taskId,
    externalConn = null,
    offset = null,
    limit = null,
    sortBy = TASK_TAG_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
  } = {}) {
    // Get database connection (new or provided external for transactions)
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
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      // Handle all other database errors
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
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Retrieves all task-tag relationships for a specific tag with optional pagination and sorting
   * @param {Object} options - Configuration options for the query
   * @param {number} options.tagId - Id of the tag whose tasks to retrieve
   * @param {import('mysql2').Connection} [options.externalConn=null] - External database connection for transactions
   * @param {number} [options.offset=null] - Number of records to skip for pagination
   * @param {number} [options.limit=null] - Maximum number of records to return
   * @param {string} [options.sortBy=TASK_TAG_SORT_FIELD.CREATED_AT] - Field to sort results by
   * @param {string} [options.sortOrder=SORT_ORDER.DESC] - Sort order (ASC or DESC)
   * @returns {Promise<Array<TaskTag>>} Array of TaskTag entities
   * @throws {ValidationError} If the tag Id is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findAllByTagId({
    tagId,
    externalConn = null,
    offset = null,
    limit = null,
    sortBy = TASK_TAG_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
  } = {}) {
    // Get database connection (new or provided external for transactions)
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
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve all taskTag for specific tag",
        {
          attemptedData: {
            tagId: tagIdNum,
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
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Retrieves a specific task-tag relationship by task Id and tag Id
   * @param {number} taskId - Id of the task
   * @param {number} tagId - Id of the tag
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions
   * @returns {Promise<TaskTag|null>} TaskTag entity if found, null otherwise
   * @throws {ValidationError} If the task Id or tag Id is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findByTaskIdAndTagId(taskId, tagId, externalConn = null) {
    // Get database connection (new or provided external for transactions)
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
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve specific taskTag ",
        {
          attemptedData: {
            taskId: taskIdNum,
            tagId: tagIdNum,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "taskTagDAO.findByTaskIdAndTagId",
        }
      );
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
}

module.exports = TaskTagDAO;
