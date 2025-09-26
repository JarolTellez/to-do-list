const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");
const { SORT_ORDER, TASK_SORT_FIELD } = require("../constants/sortConstants");
const MAPPER_TYPES  = require("../constants/mapperConstants");

class TaskDAO extends BaseDatabaseHandler {
  constructor({ taskMapper, connectionDB, errorFactory, inputValidator }) {
    super(connectionDB, inputValidator, errorFactory);
    this.taskMapper = taskMapper;
    this.errorFactory = errorFactory;
    this.inputValidator = inputValidator;
  }

  /**
   * Creates a new task in the database.
   * @param {Task} task - Task domain entity to persist.
   * @param {string} task.name - Task name (required).
   * @param {string} task.description - Task description
   * @param {Date|string} task.scheduledDate - Scheduled date for the task.
   * @param {boolean} task.isCompleted - Completion status of the task.
   * @param {string} task.priority - Task priority level.
   * @param {number} task.userId - Id of the user associated with the task.
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions.
   * @returns {Promise<Task>} Persisted task domain entity with assigned ID and timestamps.
   * @throws {DatabaseError} On database operation failure.
   * @throws {ConflictError} On duplicate task name error
   * @throws {ValidationError} If required fields are missing or invalid.
   */
  async create(task, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        "INSERT INTO tasks (name,description,scheduled_date,is_completed,priority,user_id) VALUES(?,?,?,?,?,?)",
        [
          task.name,
          task.description,
          task.scheduledDate,
          task.isCompleted,
          task.priority,
          task.userId,
        ]
      );

      const insertedId = result.insertId;
      // Retrieve the complete created task with generated Id and timestamps
      const createdTask = await this.findWithTagsByIdAndUserId(
        insertedId,
        task.userId,
        connection
      );

      return createdTask;
    } catch (error) {
      // Handle duplicated error
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw this.errorFactory.createConflictError(
          "A task with this name already exists for this user",
          { name: task.name, userId: task.userId }
        );
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError("Failed to create task", {
        attemptedData: { userId: task.userId, name: task.name },
        originalError: error.message,
        code: error.code,
        context: "taskDAO.create",
      });
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Updates an existing task in the database.
   * @param {Task} task
   * @param {string} task.name - new task name (required).
   * @param {string} task.description - new task description
   * @param {Date|string} task.scheduledDate - new scheduled date for the task.
   * @param {boolean} task.isCompleted -  new completion status of the task.
   * @param {string} task.priority -  new task priority level.
   * @param {number} task.id - Id of the task to update
   * @param {number} task.userId - Id of the user associated with the task.
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions.
   * @returns {Promise<Task>} Updated task domain entity with updated timestamps.
   * @throws {ConflictError} When name already exists or taken.
   * @throws {DatabaseError} On database operation failure.
   * @throws {ValidationError} If required fields are missing or invalid.
   */
  async update(task, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        "UPDATE tasks SET name = ?, description = ?, scheduled_date = ?, priority = ? WHERE id=? AND user_id=?",
        [
          task.name,
          task.description,
          task.scheduledDate,
          task.priority,
          task.id,
          task.userId,
        ]
      );

      if (result.affectedRows === 0) {
        return null;
      }

      // Retrieve the complete updated task with updated timestamps
      const updatedTask = await this.findWithTagsByIdAndUserId(
        task.id,
        task.userId,
        connection
      );

      return updatedTask;
    } catch (error) {
      // Handle duplicate entry errrors
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw this.errorFactory.createConflictError(
          "Already exists a task with this name",
          {
            attemptedData: { name: task.name, userId: task.userId },
          }
        );
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError("Failed to update task", {
        originalError: error.message,
        code: error.code,
        context: "taskDAO.update",
      });
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Updates isCompleted field in an existing task in the database
   * @param {numbre} id - Id of the task to update
   * @param {boolean} isCompleted - new completion status of the task
   * @param {number} userId - Id of the user associated with the task
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions.
   * @returns {Promise<Task>} Updated task domain entity with updated timestamps.
   * @throws {DatabaseError} On database operation failure.
   * @throws {ValidationError} If required fields are missing or invalid.
   */
  async updateCompleted(id, isCompleted, userId, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const taskIdNum = this.inputValidator.validateId(id, "task id");
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      if (typeof isCompleted !== "boolean") {
        throw this.errorFactory.createValidationError(
          "isCompleted must be a boolean"
        );
      }

      const [result] = await connection.execute(
        "UPDATE tasks SET is_completed = ? WHERE id = ? and user_id = ? ",
        [isCompleted, taskIdNum, userIdNum]
      );

      if (result.affectedRows === 0) {
        return null;
      }
      // Retrieve the complete updated task with updated timestamps
      const updatedTask = await this.findWithTagsByIdAndUserId(
        id,
        userId,
        connection
      );

      return updatedTask;
    } catch (error) {
      // Handle all database errors
      throw this.errorFactory.createDatabaseError(
        "Failed update as completed this task",
        {
          attemptedData: { taskId: id, userId },
          originalError: error.message,
          code: error.code,
          context: "taskDAO.updateCompleted",
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
   * Deletes a task from the database by their id and userId
   * @param {number} id - The id of the task to delete (require and unique)
   * @param {number} userId - The userId of the task to delete
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions.
   * @returns {Promise<Boolean>} True if the task was successfully deleted, false if the task didn't exist.
   * @throws {ConflictError} When task has associated data in other tables
   * @throws {DatabaseError} On database operation failure.
   * @throws {ValidationError} If required fields are missing or invalid.
   */
  async delete(id, userId, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = this.inputValidator.validateId(id, "task id");
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      const [result] = await connection.execute(
        "DELETE FROM tasks WHERE id = ? AND user_id=?",
        [taskIdNum, userIdNum]
      );

      return result.affectedRows > 0;
    } catch (error) {
      // Handle associated data in other tables
      if (error.code === "ER_ROW_IS_REFERENCED" || error.errno === 1451) {
        throw this.errorFactory.createConflictError("Failed to delete task", {
          attemptedData: { taskId: id, userId },
        });
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError("Failed to delete task", {
        attemptedData: { taskId: id, userId },
        originalError: error.message,
        code: error.code,
        context: "taskDAO.delete",
      });
    } finally {
      if (connection && !isExternal) {
        // Release only internal connection (external is managed by caller)
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Retrieve a task from the database by their id.
   * @param {number} id - The id of the task to retrieve (require and unique)
   * @param {import('mysql2').Connection} [externalConn=null] - External database connection for transactions.
   * @returns {Promise<Task>} Task domain entity if was found, null if the task didn't exist.
   * @throws {DatabaseError} On database operation failure.
   * @throws {ValidationError} If required fields are missing or invalid.
   */
  async findById(id, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = this.inputValidator.validateId(id, "task id");

      const baseQuery = `SELECT 
        id AS task_id,
        name AS task_name,
        description AS task_description,
        scheduled_date,
        created_at AS task_created_at,
        last_update_date,
        is_completed,
        priority,
        user_id
        FROM tasks
        WHERE id = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [taskIdNum],
        mapper: this.taskMapper.dbToDomain,
      });
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve task by id",
        {
          originalError: error.message,
          code: error.code,
          attemptedData: { taskId: taskIdNum },
          context: "taskDAO.findById",
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
   * Retrieves all tasks from the database with optional pagination, sorting, and filtering.
   * @param {Object} [options={}] - Configuration options for the query.
   * @param {object} [options.externalConn=null] - External database connection for transaction support.
   * @param {number} [options.limit=null] - Maximum number of records to return (pagination).
   * @param {number} [options.offset=null] - Number of records to skip for pagination.
   * @param {string} [options.sortBy=TASK_SORT_FIELD.CREATED_AT] - Field to sort results by.
   * @param {string} [options.sortOrder=SORT_ORDER.DESC] - Sort order (ASC or DESC).
   * @returns {Promise<Array>} Array of Task domain entity.
   * @throws {ValidationError} If invalid sorting parameters are provided.
   * @throws {DatabaseError} If database operation fails.
   */
  async findAll({
    externalConn = null,
    sortBy = TASK_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
    limit = null,
    offset = null,
  } = {}) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const baseQuery = ` SELECT 
        t.id AS task_id,
        t.name AS task_name,
        t.description AS task_description,
        t.scheduled_date,
        t.created_at AS task_created_at,
        t.last_update_date,
        t.is_completed,
        t.priority,
        t.user_id
        FROM tasks t`;

      return await this._executeQuery({
        connection,
        baseQuery,
        sortBy,
        sortOrder,
        sortConstants: TASK_SORT_FIELD,
        entityType: "TASK",
        entityName: "task",
        limit,
        offset,
        mapper: this.taskMapper.dbToDomain,
      });
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve all tasks",
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
          context: "taskDAO.findAll",
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
   * Retrieve a task with their tags from the database by their Id and userId
   * @param {number} id - The id of the task to retrieve
   * @param {number} userId - the userId of the task to retrieve
   * @param {object} [options.externalConn=null] - External database connection for transaction support.
   * @returns Task domain entity if was found, null if the task didn't exist.
   * @throws {ValidationError} If invalid sorting parameters are provided.
   * @throws {DatabaseError} If database operation fails.
   */
  async findWithTagsByIdAndUserId(id, userId, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = this.inputValidator.validateId(id, "task id");
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      const baseQuery = `SELECT
        t.id AS task_id,
        t.name AS task_name,
        t.description AS task_description,
        t.scheduled_date,
        t.created_at AS task_created_at,
        t.last_update_date,
        t.is_completed,
        t.user_id,
        t.priority,

        tt.id AS task_tag_id,
        tt.created_at AS task_tag_created_at,

        tg.id AS tag_id,
        tg.name AS tag_name,
        tg.description AS tag_description,
        tg.created_at AS tag_created_at

      FROM tasks t
      LEFT JOIN task_tag tt ON t.id = tt.task_id
      LEFT JOIN tags tg ON tt.tag_id = tg.id
      WHERE t.id = ? AND t.user_id = ?
      ORDER BY tg.name ASC, tt.id ASC`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [taskIdNum, userIdNum],
        mapper: (rows) => this.taskMapper.dbToDomainWithTags(rows, true),
        mapperType: MAPPER_TYPES.ALL_ROWS,
      });
      return result;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve task with tags by id and userId",
        {
          attemptedData: { taskId: id, userId },
          originalError: error.message,
          code: error.code,
          context: "taskDAO.findWithTagsByIdAndUserId",
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
   * Retrieve all tasks with their tags by their userId from the database.
   * @param {number} userId - The userId associated to the tasks to retrieve.
   * @param {boolean} isCompleted - The completion status of the task.
   * @param {Object} [options={}] - Configuration options for the query.
   * @param {object} [options.externalConn=null] - External database connection for transaction support.
   * @param {number} [options.limit=null] - Maximum number of records to return (pagination).
   * @param {number} [options.offset=null] - Number of records to skip for pagination.
   * @param {string} [options.sortBy=TASK_SORT_FIELD.LAST_UPDATE_DATE] - Field to sort results by.
   * @param {string} [options.sortOrder=SORT_ORDER.DESC] - Sort order (ASC or DESC).
   * @returns {Promise<Array>} Array of Task domain entity.
   * @throws {ValidationError} If invalid sorting parameters are provided.
   * @throws {DatabaseError} If database operation fails.
   */
  async findAllWithTagsByUserId({
    userId,
    isCompleted = false,
    sortBy = TASK_SORT_FIELD.LAST_UPDATE_DATE,
    sortOrder = SORT_ORDER.DESC,
    limit = null,
    offset = null,
    externalConn = null,
  } = {}) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      if (typeof isCompleted !== "boolean") {
        throw this.errorFactory.createValidationError(
          "isCompleted must be a boolean"
        );
      }

      // Get only the IDs of tasks that match the userId and completion status
      // Pagination is applied at this select with de ids, not the final result
      const queryIds = `SELECT t.id
       FROM tasks t
       WHERE t.user_id = ? AND t.is_completed = ?`;
      const taskIdsResult = await this._executeQuery({
        connection,
        baseQuery: queryIds,
        params: [userIdNum, isCompleted],
        sortBy,
        sortOrder,
        sortConstants: TASK_SORT_FIELD,
        entityType: "TASK",
        entityName: "task",
        limit,
        offset,
      });

      if (taskIdsResult.length === 0) {
        return [];
      }

      const taskIds = taskIdsResult.map((row) => row.id);
      const placeholders = taskIds.map(() => "?").join(",");

      // Get complete task details including tags for the filtered taskIds
      const baseQuery = `SELECT 
          t.id AS task_id,
          t.name AS task_name,
          t.description AS task_description,
          t.scheduled_date,
          t.created_at AS task_created_at,
          t.last_update_date,
          t.is_completed,
          t.user_id,
          t.priority,
          
          tt.id AS task_tag_id,
          tt.created_at AS task_tag_created_at,
          
          tg.id AS tag_id,
          tg.name AS tag_name,
          tg.description AS tag_description,
          tg.created_at AS tag_created_at
       FROM tasks t
       LEFT JOIN task_tag tt ON t.id = tt.task_id
       LEFT JOIN tags tg ON tt.tag_id = tg.id
       WHERE t.id IN (${placeholders})
       ORDER BY t.id ASC, tt.id ASC`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: taskIds,
        mapper: (rows) => this.taskMapper.dbToDomainWithTags(rows, false),
        mapperType: MAPPER_TYPES.ALL_ROWS,
      });
      return result;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve tasks with tags by user id",
        {
          attemptedData: {
            userId,
            isCompleted,
            sortBy,
            sortOrder,
            limit,
            offset,
          },
          originalError: error.message,
          code: error.code,
          stack: error.stack,
          context: "taskDAO.findAllWithTagsByUserId",
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
   * Retrieve all pending tasks by userId from the database
   * @param {Object} [options={}] - Configuration options for the query.
   * @param {object} [options.externalConn=null] - External database connection for transaction support.
   * @param {number} [options.limit=null] - Maximum number of records to return (pagination).
   * @param {number} [options.offset=null] - Number of records to skip for pagination.
   * @param {string} [options.sortBy=TASK_SORT_FIELD.LAST_UPDATE_DATE] - Field to sort results by.
   * @param {string} [options.sortOrder=SORT_ORDER.DESC] - Sort order (ASC or DESC).
   * @returns {Promise<Array>} Array of Task domain entity.
   */
  async findAllPendingByUserId({
    userId,
    sortBy = TASK_SORT_FIELD.LAST_UPDATE_DATE,
    sortOrder = SORT_ORDER.DESC,
    limit = null,
    offset = null,
    externalConn = null,
  } = {}) {
    return this.findAllWithTagsByUserId({
      userId,
      isCompleted: false,
      sortBy,
      sortOrder,
      limit,
      offset,
      externalConn,
    });
  }

  /**
   * Retrieve all completed tasks by userId from the database
   * @param {Object} [options={}] - Configuration options for the query.
   * @param {object} [options.externalConn=null] - External database connection for transaction support.
   * @param {number} [options.limit=null] - Maximum number of records to return (pagination).
   * @param {number} [options.offset=null] - Number of records to skip for pagination.
   * @param {string} [options.sortBy=TASK_SORT_FIELD.LAST_UPDATE_DATE] - Field to sort results by.
   * @param {string} [options.sortOrder=SORT_ORDER.DESC] - Sort order (ASC or DESC).
   * @returns {Promise<Array>} Array of Task domain entity.
   */
  async findAllCompleteByUserId({
    userId,
    sortBy = TASK_SORT_FIELD.LAST_UPDATE_DATE,
    sortOrder = SORT_ORDER.DESC,
    limit = null,
    offset = null,
    externalConn = null,
  } = {}) {
    return this.findAllWithTagsByUserId({
      userId,
      isCompleted: true,
      sortBy,
      sortOrder,
      limit,
      offset,
      externalConn,
    });
  }

  /**
   * Retrieve all overdue tasks by their userId from the database.
   * @param {number} userId - The userId of the tasks to retrieve.
   * @param {boolean} isCompleted - The completion status of the task.
   * @param {Object} [options={}] - Configuration options for the query.
   * @param {object} [options.externalConn=null] - External database connection for transaction support.
   * @param {number} [options.limit=null] - Maximum number of records to return (pagination).
   * @param {number} [options.offset=null] - Number of records to skip for pagination.
   * @param {string} [options.sortBy=TASK_SORT_FIELD.SCHEDULED_DATE] - Field to sort results by.
   * @param {string} [options.sortOrder=SORT_ORDER.DESC] - Sort order (ASC or DESC).
   * @returns {Promise<Array>} Array of Task domain entity.
   * @throws {ValidationError} If invalid sorting parameters are provided.
   * @throws {DatabaseError} If database operation fails.
   */
  async findAllOverdueByUserId({
    userId,
    sortBy = TASK_SORT_FIELD.SCHEDULED_DATE,
    sortOrder = SORT_ORDER.ASC,
    limit = null,
    offset = null,
    externalConn = null,
  } = {}) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      // Get only the IDs of tasks that match the userId and is_completed and scheduled_date
      // Pagination is applied at this select with de ids, not the final result
      const queryIds = `SELECT t.id
       FROM tasks t
       WHERE t.user_id = ? AND t.is_completed = FALSE AND t.scheduled_date < NOW()`;
      const taskIdsResult = await this._executeQuery({
        connection,
        baseQuery: queryIds,
        params: [userIdNum],
        sortBy,
        sortOrder,
        sortConstants: TASK_SORT_FIELD,
        entityType: "TASK",
        entityName: "task",
        limit,
        offset,
      });

      if (taskIdsResult.length === 0) {
        return [];
      }

      const taskIds = taskIdsResult.map((row) => row.id);
      const placeholders = taskIds.map(() => "?").join(",");

      // Get complete task details including tags for the filtered taskIds
      const baseQuery = `SELECT 
          t.id AS task_id,
          t.name AS task_name,
          t.description AS task_description,
          t.scheduled_date,
          t.created_at AS task_created_at,
          t.last_update_date,
          t.is_completed,
          t.user_id,
          t.priority,
          
          tt.id AS task_tag_id,
          tt.created_at AS task_tag_created_at,
          
          tg.id AS tag_id,
          tg.name AS tag_name,
          tg.description AS tag_description,
          tg.created_at AS tag_created_at
       FROM tasks t
       LEFT JOIN task_tag tt ON t.id = tt.task_id
       LEFT JOIN tags tg ON tt.tag_id = tg.id
       WHERE t.id IN (${placeholders})`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: taskIds,
        mapper: (rows) => this.taskMapper.dbToDomainWithTags(rows, false),
        mapperType: MAPPER_TYPES.ALL_ROWS,
      });

      return result;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve overdue tasks by user id",
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
          context: "taskDAO.findAllOverdueByUserId",
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
   * Count all task by userId and completion status form the database
   * @param {number} userId - The ID of the user whose tasks will be counted.
   * @param {boolean} isCompleted - The completion status to filter tasks.
   * @param {Object} [externalConn=null] - External database connection for transaction support.
   * @returns {Promise<number>} Total number of tasks matching.
   * @throws {ValidationError} If invalid sorting parameters are provided.
   * @throws {DatabaseError} If database operation fails
   */
  async countAllByUserIdAndStatus(userId, isCompleted, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      const baseQuery = `SELECT COUNT(*) AS total
         FROM tasks t
         WHERE t.user_id = ? AND t.is_completed = ?`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [userIdNum, isCompleted],
      });

      return Number(result[0]?.total) || 0;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError("Failed to count tasks", {
        originalError: error.message,
        code: error.code,
        context: "TaskDAO.countAllByUserIdAndStatus",
        userId,
        isCompleted,
      });
    } finally {
      // Release only internal connection (external is managed by caller)
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  /**
   * Count all pending task by userId and false completion status form the database
   * @param {number} userId - The ID of the user whose tasks will be counted.
   * @param {boolean} isCompleted - The completion status to filter tasks.
   * @param {Object} [externalConn=null] - External database connection for transaction support.
   * @returns {Promise<number>} Total number of tasks matching.
   * @throws {ValidationError} If invalid sorting parameters are provided.
   * @throws {DatabaseError} If database operation fails
   */
  async countAllPendingByUserId(userId, externalConn = null) {
    return this.countAllByUserIdAndStatus(userId, false, externalConn);
  }

  /**
   * Count all completed task by userId and true completion status from the database
   * @param {number} userId - The ID of the user whose tasks will be counted.
   * @param {boolean} isCompleted - The completion status to filter tasks.
   * @param {Object} [externalConn=null] - External database connection for transaction support.
   * @returns {Promise<number>} Total number of tasks matching.
   * @throws {ValidationError} If invalid sorting parameters are provided.
   * @throws {DatabaseError} If database operation fails
   */
  async countAllCompleteByUserId(userId, externalConn = null) {
    return this.countAllByUserIdAndStatus(userId, true, externalConn);
  }

  /**
   * Count all overdue task by userId from the database
   * @param {number} userId - The ID of the user whose tasks will be counted.
   * @param {boolean} isCompleted - The completion status to filter tasks.
   * @param {Object} [externalConn=null] - External database connection for transaction support.
   * @returns {Promise<number>} Total number of tasks matching.
   * @throws {ValidationError} If invalid sorting parameters are provided.
   * @throws {DatabaseError} If database operation fails
   */
  async countAllOverdueByUserId(userId, externalConn = null) {
    // Get database connection (new or provided external for transactions)
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = this.inputValidator.validateId(userId, "user id");

      const baseQuery = `SELECT COUNT(*) AS total
         FROM tasks t
         WHERE t.user_id = ? AND t.is_completed = FALSE AND t.scheduled_date < NOW()`;

      const result = await this._executeQuery({
        connection,
        baseQuery,
        params: [userIdNum],
      });

      return Number(result[0]?.total) || 0;
    } catch (error) {
      // Re-throw ValidationErrors (input issues)
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      // Handle all other database errors
      throw this.errorFactory.createDatabaseError(
        "Failed to count overdue tasks",
        {
          originalError: error.message,
          code: error.code,
          context: "TaskDAO.countAllOverdueByUserId",
          userId,
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

module.exports=TaskDAO;