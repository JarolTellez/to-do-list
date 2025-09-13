const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");
const PAGINATION_CONFIG = require("../config/pagination");
const {
  DatabaseError,
  ConflictError,
  ValidationError,
} = require("../../utils/appErrors");

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
      task.id = result.insertId;

      return task;
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
      if (connection) {
        await this.releaseConnection(connection, isExternal);
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
      if (connection) {
        await this.releaseConnection(connection, isExternal);
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
      if (connection) {
        await this.releaseConnection(connection, isExternal);
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
      if (connection) {
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
      await this.releaseConnection(connection, isExternal);
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
    }
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const userIdNum = Number(userId);
      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new ValidationError("Invalid user id");
      }

      if (typeof isCompleted !== "boolean") {
        throw new ValidationError("isCompleted must be a boolean");
      }

      if (!Object.values(TASK_SORT_FIELD).includes(sortBy)) {
        throw new ValidationError(
          `Invalid sort field. Valid values: ${Object.values(
            TASK_SORT_FIELD
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

      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) AS total
         FROM tasks t
         WHERE t.user_id = ? AND t.is_completed = ?;`,
        [userIdNum, isCompleted]
      );

      const total = Number(totalRows[0]?.total) || 0;
      const totalPages = total > 0 ? Math.ceil(total / limitNum) : 0;

      // Si no hay datos retornar de una vez
      if (total === 0 || pageNum > totalPages) {
        return {
          tasks: [],
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

    const [rows] = await connection.query(  
       `
SELECT 
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
WHERE t.user_id = ? AND t.is_completed = ?
ORDER BY t.${sortBy} ${sortOrder}, t.id, tt.id
LIMIT ? OFFSET ?`, 
     [
        userIdNum,
        isCompleted,
        limitNum,
        offset,
      ]);

      

      const mappedTasks = Array.isArray(rows)? this.taskMapper.dbToDomainWithTags(rows):[];

      return {
        tasks: mappedTasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      if(error instanceof ValidationError){
        throw error;
      }
      throw new this.DatabaseError(
        `No se pudo consultar las tareas ${
          isCompleted ? "completadas" : "pendientes"
        } en la base de datos`,
        {
          attemptedData: { userIdNum, isCompleted, page, limitNum },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  //PENDIENTE ACTUALIZAR
  // Dejarlo com subconsulta no afecta rendimieto solo consultara 1
  //consulta una tarea con sus etiquetas por id y userId
  async findWithTagsByIdAndUserId(id, userId,
    {
      externalConn = null,
    }
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const taskIdNum = Number(id);
      const userIdNum = Number(userId);

      if(!Number.isInteger(taskIdNum)||taskIdNum<=0){
        throw new ValidationError('Invalid task id');
      }

       if(!Number.isInteger(userIdNum)||userIdNum<=0){
        throw new ValidationError('Invalid user id num');
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
      ORDER BY tt.id`,
      [id, userId]
      );
     if (!rows || rows.length === 0) return null;

      const mappedTask = this.taskMapper.dbToDomainWithTags(rows);
      return mappedTask;
    } catch (error) {
      if(error instanceof ValidationError){
        throw error;
      }
      throw new this.DatabaseError("Error al consultar las tareas", {
        attemptedData: { taskId: id, userId },
        originalError: error.message,
        code: error.code,
      });
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // consulta todas las tareas pendientes por userId
  async findAllPendingByUserId(
    userId,
    {
    page = 1,
    limit = 10,
    externalConn = null
    }
  ) {
    return this.findAllWithTagsByUserId(
      userId,
      {
      isCompleted: false,
      page,
      limit,
      sortBy: "last_update_date",
      sortOrder:"DESC",
      externalConn
      }
    );
  }

  //consulta todas las tareas completadas por userId
  async findAllCompletedByUserId(
    userId,
    {
    page = 1,
    limit = 10,
    externalConn = null
    }
  ) {
    return this.findAllWithTagsByUserId(
      userId,
      {
      isCompleted:true,
      page,
      limit,
      sortBy:"last_update_date",
      sortOrder: "DESC",
      externalConn
      }
    );
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

    if (!Object.values(TASK_SORT_FIELD).includes(sortBy)) {
      throw new ValidationError(
        `Invalid sort field. Valid values: ${Object.values(TASK_SORT_FIELD).join(", ")}`
      );
    }

    if (!Object.values(SORT_ORDER).includes(sortOrder)) {
      throw new ValidationError(
        `Invalid sort order. Valid values: ${Object.values(SORT_ORDER).join(", ")}`
      );
    }

    const pageNum = Math.max(PAGINATION_CONFIG.DEFAULT_PAGE, parseInt(page, 10) || PAGINATION_CONFIG.DEFAULT_PAGE);
    let limitNum = parseInt(limit, 10) || PAGINATION_CONFIG.DEFAULT_LIMIT;

    limitNum = Math.min(limitNum, PAGINATION_CONFIG.MAX_LIMIT);
    limitNum = Math.max(1, limitNum);
    const offset = (pageNum - 1) * limitNum;

    // Total de tareas vencidas
    const [totalRows] = await connection.execute(
      `SELECT COUNT(*) AS total
       FROM tasks t
       WHERE t.user_id = ? AND t.is_completed = FALSE AND t.scheduled_date < NOW()`,
      [userIdNum]
    );

    const total = Number(totalRows[0]?.total) || 0;
    const totalPages = total > 0 ? Math.ceil(total / limitNum) : 0;

    if (total === 0 || pageNum > totalPages) {
      return {
        tasks: [],
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
       WHERE t.user_id = ? AND t.is_completed = FALSE AND t.scheduled_date < NOW()
       ORDER BY t.${sortBy} ${sortOrder}, t.id, tt.id
       LIMIT ? OFFSET ?`,
      [userIdNum, limitNum, offset]
    );

    const mappedTasks = Array.isArray(rows) ? this.taskMapper.dbToDomainWithTags(rows) : [];

    return {
      tasks: mappedTasks,
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
    if (error instanceof ValidationError) throw error;

    throw new this.DatabaseError("No se pudo consultar las tareas vencidas del usuario", {
      attemptedData: { userIdNum, page, limit },
      originalError: error.message,
      code: error.code,
    });
  } finally {
    await this.releaseConnection(connection, isExternal);
  }
}

}
module.exports = TaskDAO;
