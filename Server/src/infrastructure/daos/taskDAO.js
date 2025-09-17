const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");

const { SORT_ORDER, TASK_SORT_FIELD } = require("../constants/sortConstants");

class TaskDAO extends BaseDatabaseHandler {
  constructor({ taskMapper, connectionDB, errorFactory, sortValidator }) {
    super(connectionDB);
    this.taskMapper = taskMapper;
    this.errorFactory = errorFactory;
    this.sortValidator = sortValidator;
  }

  async create(task, externalConn = null) {
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
      const createdTask = this.findWithTagsByIdAndUserId(
        insertedId,
        task.userId
      );

      return createdTask;
    } catch (error) {
      // Duplicated error
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw this.errorFactory.createConflictError(
          "A task with this name already exists for this user",
          { name: task.name, userId: task.userId }
        );
      }
      throw this.errorFactory.createDatabaseError("Failed to create task", {
        attemptedData: { userId: task.userId, name: task.name },
        originalError: error.message,
        code: error.code,
        context: "taskDAO - create method",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async update(task, externalConn = null) {
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

      const updatedTask = this.findWithTagsByIdAndUserId(task.id, task.userId);

      return updatedTask;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw  this.errorFactory.createConflictError("Alredy exist a task with this name", {
          attemptedData: { name: task.name, userId: task.userId },
        });
      }
      throw  this.errorFactory.createDatabaseError("Failed to update task", {
        originalError: error.message,
        code: error.code,
        context: "taskDAO - update method",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async updateCompleted(id, isCompleted, userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const taskIdNum = Number(id);
      const userIdNum = Number(userId);

      if (!Number.isInteger(taskIdNum) || taskIdNum <= 0) {
        throw this.errorFactory.createValidationError("Invalid task id");
      }
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw this.errorFactory.createValidationError("Invalid user id");
      }

      if (typeof isCompleted !== "boolean") {
        throw this.errorFactory.createValidationError(
          "isCompleted must be a boolean"
        );
      }

      const [result] = await connection.execute(
        "UPDATE tasks SET is_completed = ? WHERE id = ? and user_id = ? ",
        [isCompleted, id, userId]
      );

      if (result.affectedRows === 0) {
        return null;
      }
      const updatedTask = this.findWithTagsByIdAndUserId(id, userId);

      return updatedTask;
    } catch (error) {
      throw this.errorFactory.createDatabaseError(
        "Failed update as completed this task",
        {
          attemptedData: { taskId: id, userId },
          originalError: error.message,
          code: error.code,
          context: "taskDAO - updateCompleted method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async delete(id, userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(id);
      if (!Number.isInteger(taskIdNum) || taskIdNum <= 0) {
        throw this.errorFactory.createValidationError("Invalid task id");
      }

      const [result] = await connection.execute(
        "DELETE FROM tasks WHERE id = ? AND user_id=?",
        [id, userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED" || error.errno === 1451) {
        throw  this.errorFactory.createConflictError("Failed no delete task", {
          attemptedData: { taskId: id, userId },
        });
      }

      throw  this.errorFactory.createDatabaseError("Failed to delete task", {
        attemptedData: { taskId: id, userId },
        originalError: error.message,
        code: error.code,
        context: "taskDAO - delete method",
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  //consulta tarea por id
  async findById(id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(id);

      if (!Number.isInteger(taskIdNum) || taskIdNum <= 0) {
        throw this.errorFactory.createValidationError("Invalid task id");
      }

      const [rows] = await connection.execute(
        `SELECT 
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
        WHERE id = ?`,
        [taskIdNum]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      const mappedTask = this.taskMapper.dbToDomain(rows[0]);
      return mappedTask;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve task by id",
        {
          originalError: error.message,
          code: error.code,
          attemptedData: { taskId: taskIdNum },
          context: "taskDAO -findById method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

    // Consulta una tarea con sus etiquetas por id y userId
  async findWithTagsByIdAndUserId(id, userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(id);
      const userIdNum = Number(userId);

      if (!Number.isInteger(taskIdNum) || taskIdNum <= 0) {
        throw this.errorFactory.createValidationError("Invalid task id");
      }

      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw this.errorFactory.createValidationError("Invalid user id");
      }

      const [rows] = await connection.execute(
        `SELECT
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
      ORDER BY tg.name ASC, tt.id ASC`,
        [taskIdNum, userIdNum]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) return null;

      // Si no tiene etiquetas
      if (rows.length === 1 && rows[0].task_tag_id === null) {
        return this.taskMapper.dbToDomain(rows[0]);
      }

      const mappedTask = this.taskMapper.dbToDomainWithTags(rows);
      return mappedTask;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }
      
      throw this.errorFactory.createDatabaseError(
        "Failed to retrieve task with tags by id and userId",
        {
          attemptedData: { taskId: id, userId },
          originalError: error.message,
          code: error.code,
          context: "taskDAO - findWithTagsByIdAndUserId method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  //Consulta todas las tareas con etiquetas por userId
   async findAllWithTagsByUserId({
    userId,
    isCompleted = false,
    sortBy = TASK_SORT_FIELD.LAST_UPDATE_DATE,
    sortOrder = SORT_ORDER.DESC,
    limit = null,
    offset = null,
    externalConn = null,
  } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw this.errorFactory.createValidationError("Invalid user id");
      }

      if (typeof isCompleted !== "boolean") {
        throw this.errorFactory.createValidationError(
          "isCompleted must be a boolean"
        );
      }

      const { safeField } = this.sortValidator.validateSortField(
        sortBy,
        TASK_SORT_FIELD,
        "TASK",
        "task sort field"
      );

      const { safeOrder } = this.sortValidator.validateSortOrder(
        sortOrder,
        SORT_ORDER
      );

      // Obtener IDs de tareas con límite y offset
      const [taskIdsResult] = await connection.query(
        `SELECT t.id
       FROM tasks t
       WHERE t.user_id = ? AND t.is_completed = ?
       ORDER BY ${safeField} ${safeOrder}, t.id ASC
       ${limit !== null ? "LIMIT ?" : ""} 
       ${offset !== null ? "OFFSET ?" : ""}`,
        [userIdNum, isCompleted, limit, offset].filter(param => param !== null)
      );

      if (taskIdsResult.length === 0) {
        return [];
      }

      const taskIds = taskIdsResult.map((row) => row.id);

      // Obtener detalles completos con tags solo para las tareas seleccionadas
      const [rows] = await connection.query(
        `SELECT 
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
       WHERE t.id IN (?)
       ORDER BY 
         FIELD(t.id, ${taskIds.map((_, index) => "?").join(",")}),
         tt.id ASC`,
        [taskIds, ...taskIds]
      );

      const mappedTasks =
        Array.isArray(rows) && rows.length > 0
          ? this.taskMapper.dbToDomainWithTags(rows)
          : [];

      return mappedTasks;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

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
          context: "taskDAO: findAllWithTagsByUserId method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // Consulta todas las tareas PENDIENTES por userId
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

  // Consulta todas las tareas COMPLETADAS por userId
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


  // Cuenta todas las tareas de un usuario por estado
  async countAllByUserIdAndStatus(userId, isCompleted, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw this.errorFactory.createValidationError("Invalid user id");
      }

      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total
         FROM tasks t
         WHERE t.user_id = ? AND t.is_completed = ?`,
        [userIdNum, isCompleted]
      );

      return Number(totalRows[0]?.total) || 0;
    } catch (error) {
      throw this.errorFactory.createDatabaseError("Failed to count tasks", {
        originalError: error.message,
        code: error.code,
        context: "TaskDAO.countAllByUserIdAndStatus",
        userId,
        isCompleted,
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // Cuenta todas las tareas PENDIENTES de un usuario
  async countAllPendingByUserId(userId, externalConn = null) {
    return this.countAllByUserIdAndStatus(userId, false, externalConn);
  }

  // Cuenta todas las tareas COMPLETADAS de un usuario
  async countAllCompleteByUserId(userId, externalConn = null) {
    return this.countAllByUserIdAndStatus(userId, true, externalConn);
  }

  // Cuenta todas las tareas vencidas de un usuario
  async countAllOverdueByUserId(userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw this.errorFactory.createValidationError("Invalid user id");
      }

      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total
         FROM tasks t
         WHERE t.user_id = ? AND t.is_completed = FALSE AND t.scheduled_date < NOW()`,
        [userIdNum]
      );

      return Number(totalRows[0]?.total) || 0;
    } catch (error) {
      throw this.errorFactory.createDatabaseError("Failed to count overdue tasks", {
        originalError: error.message,
        code: error.code,
        context: "TaskDAO.countAllOverdueByUserId",
        userId,
      });
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // Consulta todas las tareas vencidas de un usuario
  async findAllOverdueByUserId({
    userId,
    sortBy = TASK_SORT_FIELD.SCHEDULED_DATE,
    sortOrder = SORT_ORDER.ASC,
    limit = null,
    offset = null,
    externalConn = null,
  } = {}) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw this.errorFactory.createValidationError("Invalid user id");
      }

      const { safeField } = this.sortValidator.validateSortField(
        sortBy,
        TASK_SORT_FIELD,
        "TASK",
        "task sort field"
      );

      const { safeOrder } = this.sortValidator.validateSortOrder(
        sortOrder,
        SORT_ORDER
      );

      // Obtener IDs de tareas vencidas con limit y offset
      const [taskIdsResult] = await connection.query(
        `SELECT t.id
       FROM tasks t
       WHERE t.user_id = ? AND t.is_completed = FALSE AND t.scheduled_date < NOW()
       ORDER BY ${safeField} ${safeOrder}, t.id ASC
       ${limit !== null ? "LIMIT ?" : ""} 
       ${offset !== null ? "OFFSET ?" : ""}`,
        [userIdNum, limit, offset].filter(param => param !== null)
      );

      if (taskIdsResult.length === 0) {
        return [];
      }

      const taskIds = taskIdsResult.map((row) => row.id);

      // Obtener detalles completos con tags
      const [rows] = await connection.query(
        `SELECT 
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
       WHERE t.id IN (?)
       ORDER BY 
         FIELD(t.id, ${taskIds.map((_, index) => "?").join(",")}),
         tt.id ASC`,
        [taskIds, ...taskIds]
      );

      const mappedTasks =
        Array.isArray(rows) && rows.length > 0
          ? this.taskMapper.dbToDomainWithTags(rows)
          : [];

      return mappedTasks;
    } catch (error) {
      if (error instanceof this.errorFactory.Errors.ValidationError) {
        throw error;
      }

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
          context: "taskDAO: findAllOverdueByUserId method",
        }
      );
    } finally {
      if (connection && !isExternal) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
  
}


