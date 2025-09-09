const { logError } = require("../../utils/logger");
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
        "UPDATE tasks SET name = ?, description = ?, scheduled_date = ?, last_update_date = ?, priority = ? WHERE id=?",
        [
          task.name,
          task.description,
          task.scheduledDate,
          task.lastUpdateDate,
          task.priority,
          task.id,
        ]
      );

      return task;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw new this.ConflictError("Ya existe una tarea con ese nombre", {
          attemptedData: { name: task.name },
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

  async updateCompleted(id, isCompleted, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        "UPDATE tasks SET is_completed = ? WHERE id = ?",
        [isCompleted, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new this.DatabaseError(
        "Error a marcar como completada la tarea en la base de datos",
        {
          attemptedData: { taskId: id },
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

  async delete(id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        "DELETE FROM tasks WHERE id = ?",
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED" || error.errno === 1451) {
        throw new this.ConflictError("No se puede eliminar la tarea", {
          attemptedData: { taskId: id },
        });
      }

      throw new this.DatabaseError("No se pudo eliminar la tarea", {
        attemptedData: { taskId: id },
        originalError: error.message,
        code: error.code,
      });
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findById(id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [rows] = await connection.execute(
        `SELECT 
    t.id,
    t.name,
    t.description,
    t.scheduled_date,
    t.created_at,
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
                'description', e.description,
                'user_id', e.user_id
            )
        )
        FROM task_tag te
        JOIN tags e ON te.tag_id = e.id
        WHERE te.task_id = t.id
        ORDER BY te.id
    ) AS tags
    
FROM tasks t
WHERE t.id = ?;`,
        [id]
      );
      const row = rows[0];
      if (!row) return null;

      const mappedTask = this.taskMapper.taskWithTagsDbToDomain(row);
      return mappedTask;
    } catch (error) {
      throw new this.DatabaseError("No se pudo consultar la consulta por id", {
        attemptedData: { taskId: id },
        originalError: error.message,
        code: error.code,
      });
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findByIdAndUserId(id, userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [rows] = await connection.execute(
        `SELECT 
    t.id,
    t.name,
    t.description,
    t.scheduled_date,
    t.created_at,
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
                'description', e.description,
                'user_id', e.user_id
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
        attemptedData: { taskId: id },
        originalError: error.message,
        code: error.code,
      });
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  //Consulta las tasks pendientes del usuario, es decir las que no estan marcadas como completadas
  async findPendingByUserId(userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [rows] = await connection.execute(
        `SELECT 
    t.id,
    t.name,
    t.description,
    t.scheduled_date,
    t.created_at,
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
                'description', e.description,
                'user_id', e.user_id
            )
        )
        FROM task_tag te
        INNER JOIN tags e ON te.tag_id = e.id
        WHERE te.task_id = t.id
        ORDER BY te.id
    ) AS tags
    
FROM tasks t
WHERE t.user_id = ? AND t.is_completed = 0
ORDER BY t.last_update_date DESC`,
        [userId]
      );

      if (!rows || rows.length === 0) {
        return [];
      }

      const mappedTasks = rows.map((row) => {
        try {
          return this.taskMapper.taskWithTagsDbToDomain(row);
        } catch (error) {
          return null;
        }
      });
      console.log("LAS MAPEDAS:", mappedTasks);
      // return tasks;
      return mappedTasks;
    } catch (error) {
      throw new this.DatabaseError(
        "No se pudo consultar las tareas pendientes en la base de datos",
        {
          attemptedData: { userId },
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

  //Consulta todas las tasks del usuario tanto las que estan completadas como las que no
  async findCompletedByUserId(userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.execute(
        `SELECT 
    t.id,
    t.name,
    t.description,
    t.scheduled_date,
    t.created_at,
    t.last_update_date,
    t.is_completed,
    t.user_id,
    t.priority,
    
    -- JSON structure for tags
    (
        SELECT JSON_ARRAYAGG(
           JSON_OBJECT(
                'id', e.id,
                'task_tag_id', te.id,
                'name', e.name,
                'description', e.description,
                'user_id', e.user_id
            )
        )
        FROM task_tag te
        INNER JOIN tags e ON te.tag_id = e.id
        WHERE te.task_id = t.id
        ORDER BY te.id
    ) AS tags
    
FROM tasks t
WHERE t.user_id = ? AND t.is_completed = 1
ORDER BY t.last_update_date DESC`,
        [userId]
      );

      if (!rows || rows.length === 0) {
        return [];
      }

      const mappedTasks = rows.map((row) => {
        try {
          return this.taskMapper.taskWithTagsDbToDomain(row);
        } catch (error) {
          return null;
        }
      });

      return mappedTasks;
    } catch (error) {
      throw new this.DatabaseError(
        "Error al consultar las tareas completadas en la base de datos",
        {
          attemptedData: { userId },
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
}
module.exports = TaskDAO;
