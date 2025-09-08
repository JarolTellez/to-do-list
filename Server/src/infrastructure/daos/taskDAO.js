const { logError } = require("../../utils/logger");
const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");

class TaskDAO extends BaseDatabaseHandler {
  constructor({
    taskMapper,
    connectionDB,
    DatabaseError,
    ConflictError,
  }) {
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
        throw new this.ConflictError("Ya existe una rows con ese name");
      }
      throw new this.DatabaseError("No se pudo actualizar la rows", {
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

      return result.affectedRows>0;
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
      const result = await connection.execute(
        "DELETE FROM tasks WHERE id = ?",
        [id]
      );

      return result.affectedRows>0;
    } catch (error) {

      if (error.code === "ER_ROW_IS_REFERENCED" || error.errno === 1451) {
        throw new this.ConflictError(
          "No se puede eliminar la rows porque tiene  asociadas",
          { attemptedData: { taskId: id } }
        );
      }

      throw new this.DatabaseError("No se pudo eliminar la rows", {
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

  // async findAll(externalConn = null) {
  //   const { connection, isExternal } = await this.getConnection(externalConn);
  //   try {
  //     const [rows] = await connection.query("SELECT * FROM tasks");
  //     return rows;
  //   } catch (error) {
  //     throw new this.DatabaseError(
  //       "Error al consultar todas las tareas en la base de datos",
  //       { originalError: error.message, code: error.code }
  //     );
  //   } finally {
  //     if (connection) {
  //       await this.releaseConnection(this.connectionDB, isExternal);
  //     }
  //   }
  // }

  // async findByName(name, externalConn = null) {
  //   const { connection, isExternal } = await this.getConnection(externalConn);

  //   try {
  //     const [rows] = await connection.execute(
  //       "SELECT * FROM tasks WHERE name = ?",
  //       [name]
  //     );

  //     return rows[0];
  //   } catch (error) {

  //     throw new this.DatabaseError("Error al consultar la tarea en la base de datos", {
  //       attemptedData:{name},
  //       originalError: error.message,
  //       code: error.code,
  //     });
  //   } finally {
  //     if (connection) {
  //       await this.releaseConnection(connection, isExternal);
  //     }
  //   }
  // }

  async findById(id, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);

    try {
      const [rows] = await connection.execute(
        `SELECT 
    t.id AS tarea_id,
    t.name AS tarea_nombre,
    t.description AS tarea_descripcion,
    t.scheduled_date AS tarea_fecha_programada,
    t.created_at AS tarea_fecha_creacion,
    t.last_update_date AS tarea_ultima_actualizacion,
    t.is_completed AS tarea_completada, 
    t.user_id AS tarea_id_usuario,  
    t.priority AS tarea_prioridad, 
  
    GROUP_CONCAT(DISTINCT te.id ORDER BY te.id SEPARATOR ',') AS tarea_etiqueta_ids,  
    GROUP_CONCAT(DISTINCT e.id ORDER BY te.id SEPARATOR ',') AS etiquetas_ids,         
    GROUP_CONCAT(DISTINCT e.name ORDER BY te.id SEPARATOR ',') AS etiquetas_nombres,
    GROUP_CONCAT(e.description ORDER BY te.id SEPARATOR ',') AS etiquetas_descripciones,
    GROUP_CONCAT(e.user_id ORDER BY te.id SEPARATOR ',') AS etiquetas_usuarios
FROM 
    tasks t
LEFT JOIN 
    task_tag te ON t.id = te.task_id 
LEFT JOIN 
    tags e ON te.tag_id = e.id        
WHERE 
    t.id = ?
GROUP BY 
    t.id;`,
        [id]
      );


      const mappedTasks = rows.map((row) => {
        return this.taskMapper.taskWithTagsDbToDomain(row);
      });
      return mappedTasks;
    } catch (error) {
      throw new this.DatabaseError("No se pudo consultar la consulta por id", {
        attemptedData:{taskId: id},
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
        "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
        [id, userId]
      );

      return rows[0];
    } catch (error) {

      throw new this.DatabaseError(
        "Error al consultar la tarea en la base de datos",
        {attemptedData:{taskId: id, userId}, originalError: error.message, code: error.code }
      );
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
    t.id AS tarea_id,
    t.name AS tarea_nombre,
    t.description AS tarea_descripcion,
    t.scheduled_date AS tarea_fecha_programada,
    t.created_at AS tarea_fecha_creacion,
    t.last_update_date AS tarea_ultima_actualizacion,
    t.is_completed AS tarea_completada,
    t.user_id AS tarea_id_usuario,
    t.priority AS tarea_prioridad,
    

    GROUP_CONCAT(DISTINCT te.id ORDER BY te.id SEPARATOR ',') AS tarea_etiqueta_ids,
    GROUP_CONCAT(DISTINCT e.id ORDER BY te.id SEPARATOR ',') AS etiquetas_ids,
    GROUP_CONCAT(DISTINCT e.name ORDER BY te.id SEPARATOR ',') AS etiquetas_nombres,
    GROUP_CONCAT(e.description ORDER BY te.id SEPARATOR ',') AS etiquetas_descripciones,
    GROUP_CONCAT(e.user_id ORDER BY te.id SEPARATOR ',') AS etiquetas_usuarios

FROM 
    tasks t
LEFT JOIN 
    task_tag te ON t.id = te.task_id 
LEFT JOIN 
    tags e ON te.tag_id = e.id         
WHERE 
    t.user_id = ? AND t.is_completed = 0
GROUP BY 
    t.id;`,
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

      // return tasks;
      return mappedTasks;
    } catch (error) {
      throw new this.DatabaseError(
        "No se pudo consultar las tareas pendientes en la base de datos",
        {attemptedData:{userId}, originalError: error.message, code: error.code }
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
    t.id AS tarea_id,
    t.name AS tarea_nombre,
    t.description AS tarea_descripcion,
    t.scheduled_date AS tarea_fecha_programada,
    t.created_at AS tarea_fecha_creacion,
    t.last_update_date AS tarea_ultima_actualizacion,
    t.is_completed AS tarea_completada,
    t.user_id AS tarea_id_usuario,
    t.priority AS tarea_prioridad,
    

    GROUP_CONCAT(DISTINCT te.id ORDER BY te.id SEPARATOR ',') AS tarea_etiqueta_ids,
    GROUP_CONCAT(DISTINCT e.id ORDER BY te.id SEPARATOR ',') AS etiquetas_ids,
    GROUP_CONCAT(DISTINCT e.name ORDER BY te.id SEPARATOR ',') AS etiquetas_nombres,
    GROUP_CONCAT(e.description ORDER BY te.id SEPARATOR ',') AS etiquetas_descripciones,
    GROUP_CONCAT(e.user_id ORDER BY te.id SEPARATOR ',') AS etiquetas_usuarios

FROM 
    tasks t
LEFT JOIN 
    task_tag te ON t.id = te.task_id 
LEFT JOIN 
    tags e ON te.tag_id = e.id         

WHERE 
    t.user_id = ? AND t.is_completed = 1

GROUP BY 
    t.id`,
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
        {attemptedData:{userId}, originalError: error.message, code: error.code }
      );
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
}
module.exports = TaskDAO;
