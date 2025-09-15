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

const { SORT_ORDER, TASK_SORT_FIELD } = require("../constants/sortConstants");

class TaskDAO extends BaseDatabaseHandler {
  constructor({ taskMapper, connectionDB }) {
    super(connectionDB);
    this.taskMapper = taskMapper;
  }

  async create(task, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        "INSERT INTO tasks (name,description,scheduled_date,created_at,last_update_date,is_completed,priority,user_id) VALUES(?,?,?,?,?,?,?,?)",
        [
          task.name,
          task.description,
          task.scheduledDate,
          task.createdAt,
          task.lastUpdateDate,
          task.isCompleted,
          task.priority,
          task.userId,
        ]
      );
      const actualTask = await this.findWithTagsByIdAndUserId(
        result.insertId,
        task.userId
      );
      return actualTask;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw new this.ConflictError(
          "Ya existe una tarea con ese nombre para este usuario",
          { name: task.name, userId: task.userId }
        );
      }
      throw new this.DatabaseError(
        "Error al guardar la tarea en la base de datos",
        {
          attemptedData: { userId: task.userId, name: task.name },
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

  async update(task, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        "UPDATE tasks SET name = ?, description = ?, scheduled_date = ?, last_update_date = NOW(), priority = ? WHERE id=? AND user_id=?",
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

      const [updatedRows] = await connection.execute(
        "SELECT last_update_date FROM tasks WHERE id = ?",
        [task.id]
      );

      task.lastUpdateDate = updatedRows[0]?.last_update_date;
      return task;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw new this.ConflictError("Ya existe una tarea con ese nombre", {
          attemptedData: { name: task.name, userId: task.userId },
        });
      }
      throw new this.DatabaseError("No se pudo actualizar la tarea", {
        originalError: error.message,
        code: error.code,
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

  async updateCompleted(id, isCompleted, userId, externalConn = null) {
    console.log("DATOS RECIIVIDOA:", id, isCompleted, userId);
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        "UPDATE tasks SET is_completed = ?, last_update_date = NOW() WHERE id = ? and user_id = ? ",
        [isCompleted, id, userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new this.DatabaseError(
        "Error a marcar como completada la tarea en la base de datos",
        {
          attemptedData: { taskId: id, userId },
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

  async delete(id, userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        "DELETE FROM tasks WHERE id = ? AND user_id=?",
        [id, userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED" || error.errno === 1451) {
        throw new this.ConflictError("No se puede eliminar la tarea", {
          attemptedData: { taskId: id, userId },
        });
      }

      throw new this.DatabaseError("No se pudo eliminar la tarea", {
        attemptedData: { taskId: id, userId },
        originalError: error.message,
        code: error.code,
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

  //consulta tarea por id
  async findById(id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(id);

      if (!Number.isInteger(taskIdNum) || taskIdNum <= 0) {
        throw new ValidationError("Invalid task id");
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
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError("No se pudo consultar la tarea por id", {
        originalError: error.message,
        code: error.code,
        attemptedData: { taskId: taskIdNum },
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

  // consulta todas las tareas con etiquetas de un usuario
  async findAllWithTagsByUserId(
    userId,
    {
      isCompleted = false,
      page = PAGINATION_CONFIG.DEFAULT_PAGE,
      limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
      sortBy = TASK_SORT_FIELD.LAST_UPDATE_DATE,
      sortOrder = SORT_ORDER.DESC,
      externalConn = null,
    } = {}
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new ValidationError("Invalid user id");
      }

      let completedBool = isCompleted;
      if (typeof isCompleted === "string") {
        completedBool = isCompleted.toLowerCase() === "true";
      }
      if (typeof completedBool !== "boolean") {
        throw new ValidationError(
          "isCompleted must be a boolean or boolean string"
        );
      }

      const { safeField } = validateSortField(
        sortBy,
        TASK_SORT_FIELD,
        "TASK",
        "task sort field"
      );

      const { safeOrder } = validateSortOrder(sortOrder, SORT_ORDER);

      const pagination = calculatePagination(
        page,
        limit,
        PAGINATION_CONFIG.MAX_LIMIT,
        PAGINATION_CONFIG.DEFAULT_PAGE,
        PAGINATION_CONFIG.DEFAULT_LIMIT
      );

      // CONSULTA 1: Contar total de TAREAS
      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total
       FROM tasks t
       WHERE t.user_id = ? AND t.is_completed = ?;`,
        [userIdNum, completedBool]
      );

      const total = Number(totalRows[0]?.total) || 0;
      const totalPages = calculateTotalPages(total, pagination.limit);

      // retornar si no hay datos o pagina invalida
      if (total === 0 || pagination.page > totalPages) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "tasks"
        );
      }

      // CONSULTA 2: Obtener IDs de tareas paginadas (sin etiquetas para evitar duplicados)
      const [taskIdsResult] = await connection.query(
        `SELECT t.id
       FROM tasks t
       WHERE t.user_id = ? AND t.is_completed = ?
       ORDER BY ${safeField} ${safeOrder}, t.id ASC
       LIMIT ? OFFSET ?`,
        [userIdNum, completedBool, pagination.limit, pagination.offset]
      );

      if (taskIdsResult.length === 0) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "tasks"
        );
      }

      const taskIds = taskIdsResult.map((row) => row.id);

      // CONSULTA 3: Obtener detalles completos con tags solo para las tareas paginadas
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
        [taskIds, ...taskIds] // doble para el FIELD y el IN
      );

      const mappedTasks =
        Array.isArray(rows) && rows.length > 0
          ? this.taskMapper.dbToDomainWithTags(rows)
          : [];

      return buildPaginationResponse(
        mappedTasks,
        pagination,
        total,
        totalPages,
        "tasks"
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      console.error("Database error in findAllWithTagsByUserId:", {
        userId,
        isCompleted,
        error: error.message,
      });

      throw new this.DatabaseError(
        `No se pudo consultar las tareas ${
          isCompleted ? "completadas" : "pendientes"
        } en la base de datos`,
        {
          attemptedData: {
            userId,
            isCompleted:
              typeof isCompleted === "boolean" ? isCompleted : completedBool,
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

  //consulta una tarea con sus etiquetas por id y userId
  async findWithTagsByIdAndUserId(id, userId, { externalConn = null }) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(id);
      const userIdNum = Number(userId);

      if (!Number.isInteger(taskIdNum) || taskIdNum <= 0) {
        throw new ValidationError("Invalid task id");
      }

      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new ValidationError("Invalid user id num");
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

      //si no tiene etiquetas
      if (rows.length === 1 && rows[0].task_tag_id === null) {
        return this.taskMapper.dbToDomain(rows[0]);
      }

      const mappedTask = this.taskMapper.dbToDomainWithTags(rows);
      return mappedTask;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new this.DatabaseError("Error al consultar las tareas", {
        attemptedData: { taskId: id, userId },
        originalError: error.message,
        code: error.code,
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

  // consulta todas las tareas pendientes por userId
  async findAllPendingByUserId(userId, { page, limit, externalConn } = {}) {
    return this.findAllWithTagsByUserId(userId, {
      isCompleted: false,
      page,
      limit,
      sortBy: TASK_SORT_FIELD.LAST_UPDATE_DATE,
      sortOrder: SORT_ORDER.DESC,
      externalConn,
    });
  }

  //consulta todas las tareas completadas por userId
  async findAllPendingByUserId(userId, { page, limit, externalConn } = {}) {
    return this.findAllWithTagsByUserId(userId, {
      isCompleted: true,
      page,
      limit,
      sortBy: TASK_SORT_FIELD.LAST_UPDATE_DATE,
      sortOrder: SORT_ORDER.DESC,
      externalConn,
    });
  }

  //consulta todas las tareas vencidas de un usuario
  async findAllOverdueTasksByUserId(
    userId,
    {
      page = PAGINATION_CONFIG.DEFAULT_PAGE,
      limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
      sortBy = TASK_SORT_FIELD.SCHEDULED_DATE,
      sortOrder = SORT_ORDER.ASC,
      externalConn = null,
    } = {}
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new ValidationError("Invalid user id");
      }
      const { safeField } = validateSortField(
        sortBy,
        TASK_SORT_FIELD,
        "TASK",
        "task sort field"
      );

      const { safeOrder } = validateSortOrder(sortOrder, SORT_ORDER);

      const pagination = calculatePagination(
        page,
        limit,
        PAGINATION_CONFIG.MAX_LIMIT,
        PAGINATION_CONFIG.DEFAULT_PAGE,
        PAGINATION_CONFIG.DEFAULT_LIMIT
      );

      // CONSULTA 1: Contar total de TAREAS vencidas
      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total
       FROM tasks t
       WHERE t.user_id = ? AND t.is_completed = FALSE AND t.scheduled_date < NOW()`,
        [userIdNum]
      );

      const total = Number(totalRows[0]?.total) || 0;
      const totalPages = calculateTotalPages(total, pagination.limit);

      // Early return si no hay datos o pagina inválida
      if (total === 0 || pagination.page > totalPages) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "tasks"
        );
      }

      // CONSULTA 2: Obtener IDs de tareas vencidas paginadas
      const [taskIdsResult] = await connection.query(
        `SELECT t.id
       FROM tasks t
       WHERE t.user_id = ? AND t.is_completed = FALSE AND t.scheduled_date < NOW()
       ORDER BY ${safeField} ${safeOrder}, t.id ASC
       LIMIT ? OFFSET ?`,
        [userIdNum, pagination.limit, pagination.offset]
      );

      if (taskIdsResult.length === 0) {
        return buildPaginationResponse(
          [],
          pagination,
          total,
          totalPages,
          "tasks"
        );
      }

      const taskIds = taskIdsResult.map((row) => row.id);

      // CONSULTA 3: Obtener detalles completos con tags solo para las tareas paginadas
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
        [taskIds, ...taskIds] // Doble para el FIELD y el IN
      );

      const mappedTasks =
        Array.isArray(rows) && rows.length > 0
          ? this.taskMapper.dbToDomainWithTags(rows)
          : [];

      return buildPaginationResponse(
        mappedTasks,
        pagination,
        total,
        totalPages,
        "tasks"
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      console.error("Database error in findAllOverdueTasksByUserId:", {
        userId,
        error: error.message,
      });

      throw new this.DatabaseError(
        "No se pudo consultar las tareas vencidas del usuario",
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
}
module.exports = TaskDAO;
