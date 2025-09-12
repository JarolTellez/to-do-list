const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");

class TaskDAO extends BaseDatabaseHandler {
  constructor({ taskMapper, connectionDB, DatabaseError, ConflictError }) {
    super(connectionDB);
    this.taskMapper = taskMapper;
    this.DatabaseError = DatabaseError;
    this.ConflictError = ConflictError;
  }

  async create(task, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        "INSERT INTO tasks (name,description,scheduled_date,created_at,last_update_date,is_completed,user_id,priority) VALUES(?,?,?,?,?,?,?,?)",
        [
          task.name,
          task.description,
          task.scheduledDate,
          task.createdAt,
          task.lastUpdateDate,
          task.isCompleted,
          task.userId,
          task.priority,
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

  //PENDIENTE ACTUALIZAR
  // Dejarlo com subconsulta no afecta rendimieto solo consultara 1
  async findByIdAndUserId(id, userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
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
    
    (
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', e.id,
                'task_tag_id', te.id,
                'name', e.name,
                'description', e.description
            )
        )
        FROM task_tag te
        INNER JOIN tags e ON te.tag_id = e.id
        WHERE te.task_id = t.id
        ORDER BY te.id
    ) AS tags
    
FROM tasks t
WHERE t.id = ? AND t.user_id = ?;`,
        [id, userId]
      );
      const row = rows[0];
      if (!row) return null;

      const mappedTask = this.taskMapper.taskWithTagsDbToDomain(row);
      return mappedTask;
    } catch (error) {
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

  async findByUserId(
    userId,
    isCompleted = false,
    page = 1,
    limit = 10,
    orderBy = "last_update_date",
    orderDirection = "DESC",
    externalConn = null
  ) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const offset = (page - 1) * limit;

      const validDirections = ["ASC", "DESC"];
      const direction = validDirections.includes(orderDirection.toUpperCase())
        ? orderDirection.toUpperCase()
        : "DESC";

      const validOrderFields = [
        "last_update_date",
        "created_at",
        "scheduled_date",
        "name",
        "priority",
        "id",
      ];
      const orderField = validOrderFields.includes(orderBy)
        ? orderBy
        : "last_update_date";

      const query = `
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
  e.id as tag_id,
  te.id as task_tag_id,
  e.name as tag_name,
  e.description as tag_description,
  e.user_id as tag_user_id
FROM tasks t
LEFT JOIN task_tag te ON t.id = te.task_id
LEFT JOIN tags e ON te.tag_id = e.id
WHERE t.user_id = ? AND t.is_completed = ?
ORDER BY t.${orderField} ${direction}, t.id, te.id
LIMIT ? OFFSET ?;
    `;

      const [rows] = await connection.query(query, [
        userId,
        isCompleted ? 1 : 0,
        limit,
        offset,
      ]);

      if (!rows || rows.length === 0) {
        return {
          tasks: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      const [totalRows] = await connection.execute(
        `SELECT COUNT(*) as total 
       FROM tasks t 
       WHERE t.user_id = ? AND t.is_completed = ?`,
        [userId, isCompleted ? 1 : 0]
      );

      const total = totalRows[0]?.total || 0;
      const totalPages = Math.ceil(total / limit);

      const mappedTasks = this.taskMapper.tasksWithTagsFromJoinResult(rows);

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
      throw new this.DatabaseError(
        `No se pudo consultar las tareas ${
          isCompleted ? "completadas" : "pendientes"
        } en la base de datos`,
        {
          attemptedData: { userId, isCompleted, page, limit },
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
  async findPendingByUserId(userId, page = 1, limit = 10, externalConn = null) {
    return this.findByUserId(
      userId,
      false,
      page,
      limit,
      "last_update_date",
      "DESC",
      externalConn
    );
  }

  async findCompletedByUserId(
    userId,
    page = 1,
    limit = 10,
    externalConn = null
  ) {
    return this.findByUserId(
      userId,
      true,
      page,
      limit,
      "last_update_date",
      "DESC",
      externalConn
    );
  }
}
module.exports = TaskDAO;
