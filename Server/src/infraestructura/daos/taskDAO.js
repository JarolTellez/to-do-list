const { logError } = require('../../utils/logger');
const BaseDatabaseHandler = require('../config/BaseDatabaseHandler');

class TaskDAO  extends BaseDatabaseHandler{
  constructor(
   { taskMapper,
    connectionDB,
    DatabaseError,
    NotFoundError,
    ConflictError}
  ) {
    super(connectionDB);
    this.taskMapper = taskMapper;
    this.DatabaseError = DatabaseError;
    this.NotFoundError = NotFoundError;
    this.ConflictError = ConflictError;
  }

  async create(rows, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        'INSERT INTO tasks (name,description,scheduled_date,created_at,last_update_date,is_completed,user_id,priority) VALUES(?,?,?,?,?,?,?,?)',
        [
          rows.name,
          rows.description,
          rows.scheduledDate,
          rows.createdAt,
          rows.lastUpdateDate,
          rows.isCompleted,
          rows.userId,
          rows.priority,
        ]
      );
      rows.id = result.insertId;

      return rows;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new this.ConflictError(
          'Ya existe una rows con ese name para este usuario',
          { name: rows.name, userId: rows.userId }
        );
      }
      throw new this.DatabaseError('No se pudo guardar la tarea', {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async update(task, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        'UPDATE tasks SET name = ?, description = ?, scheduled_date = ?, last_update_date = ?, priority = ? WHERE id=?',
        [
          task.name,
          task.description,
          task.scheduledDate,
          task.lastUpdateDate,
          task.priority,
          task.id,
        ]
      );

      if (result.affectedRows === 0) {
        throw new this.NotFoundError('La rows no existe');
      }
      return task;
    } catch (error) {
    
      if (error instanceof this.NotFoundError) throw error;

      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new this.ConflictError('Ya existe una rows con ese name');
      }
      throw new this.DatabaseError('No se pudo actualizar la rows', {
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
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        'UPDATE tasks SET is_completed = ? WHERE id = ?',
        [isCompleted, id]
      );
      if (result.affectedRows === 0) {
        throw new this.NotFoundError('La rows no existe');
      }

      return result.affectedRows;
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;

      throw new this.DatabaseError(
        'No se pudo marcar la rows como is_completed',
        { originalError: error.message, code: error.code }
      );
    } finally {
      if (connection) {
       await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async delete(id, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const result = await connection.execute(
        'DELETE FROM tasks WHERE id = ?',
        [id]
      );
      if (result.affectedRows === 0) {
        throw new this.NotFoundError('La rows no existe');
      }

      return result[0].affectedRows;
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;

      if (error.code === 'ER_ROW_IS_REFERENCED' || error.errno === 1451) {
        throw new this.ConflictError(
          'No se puede eliminar la rows porque tiene  asociadas',
          { id }
        );
      }

      throw new this.DatabaseError('No se pudo eliminar la rows', {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async findAll(externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.query('SELECT * FROM tasks');
      return rows;
    } catch (error) {
      throw new this.DatabaseError('No se pudo consultar todas las tasks', {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      if (connection) {
        await this.releaseConnection(this.connectionDB, isExternal);
      }
    }
  }

  async findByName(nombre, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [rows] = await connection.execute(
        'SELECT * FROM tasks WHERE name = ?',
        [nombre]
      );

      if (!rows[0]) {
        throw new this.NotFoundError('Tarea no encontrada');
      }
      return rows[0];
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;

      throw new this.DatabaseError('No se pudo consultar la tarse por nombre', {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  // async findById(id, externalConn = null) {
  //    const {connection, isExternal} = await this.getConnection(externalConn);
  //   try {
  //     const [rows] = await connection.execute(
  //       'SELECT * FROM tasks WHERE id = ?',
  //       [id]
  //     );

  //     if (!rows[0]) {
  //       throw new this.NotFoundError('Tarea no encontrada');
  //     }
  //     return rows[0];
  //   } catch (error) {
  //     if (error instanceof this.NotFoundError) throw error;

  //     throw new this.DatabaseError('No se pudo consultar la rows por id', {
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
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [rows] = await connection.execute(
//         `SELECT 
//     t.id AS tarea_id,
//     t.name AS tarea_nombre,
//     t.description AS tarea_descripcion,
//     t.scheduled_date AS tarea_fecha_programada,
//     t.created_at AS tarea_fecha_creacion,
//     t.last_update_date AS tarea_ultima_actualizacion,
//     t.isCompleted AS tarea_completada,
//     t.priority AS tarea_prioridad,
//     t.user_id AS tarea_id_usuario,  
  
//       GROUP_CONCAT(DISTINCT te.id_tarea_etiqueta ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS tarea_etiqueta_ids,
//       GROUP_CONCAT(DISTINCT e.id_etiqueta ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_ids,
//       GROUP_CONCAT(DISTINCT e.name ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_nombres,
//       GROUP_CONCAT(e.description ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_descripciones,
//       GROUP_CONCAT(e.user_id ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_usuarios
// FROM 
//     tasks t
// LEFT JOIN 
//     task_tag te ON t.id = te.task_id
// LEFT JOIN 
//     tags e ON te.tag_id = e.id
// WHERE 
//     t.id = ?
// GROUP BY 
//     t.id`,
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

      if (rows.length === 0) {
        throw new this.NotFoundError(
          'No se encontró la rows con el id proporcionado'
        );
      }

      const mappedTasks = rows.map((row) => {
        return this.taskMapper.taskWithTagsDbToDomain(row);
      });
      return mappedTasks;
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;

      throw new this.DatabaseError('No se pudo consultar la consulta por id', {
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
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [rows] = await connection.execute(
        'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      if (!rows[0]) {
        throw new this.NotFoundError('Tarea no encontrada para este usuario');
      }

      return rows[0];
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;

      throw new this.DatabaseError(
        'No se pudo consultar la rows por id y usuario',
        { originalError: error.message, code: error.code }
      );
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  //Consulta las tasks pendientes del usuario, es decir las que no estan marcadas como completadas
  async findPendingByUserId(userId, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [rows] = await connection.execute(
//         `SELECT 
//   t.id AS tarea_id,
//   t.name AS tarea_nombre,
//   t.description AS tarea_descripcion,
//   t.scheduled_date AS tarea_fecha_programada,
//   t.created_at AS tarea_fecha_creacion,
//   t.last_update_date AS tarea_ultima_actualizacion,
//   t.isCompleted AS tarea_completada,
//   t.priority AS tarea_prioridad,
//   t.user_id AS tarea_id_usuario,

//   GROUP_CONCAT(DISTINCT te.id_tarea_etiqueta ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS tarea_etiqueta_ids,
//   GROUP_CONCAT(DISTINCT e.id_etiqueta ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_ids,
//   GROUP_CONCAT(DISTINCT e.name ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_nombres,
//   GROUP_CONCAT(e.description ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_descripciones,
//   GROUP_CONCAT(e.user_id ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_usuarios

// FROM 
//   tasks t
// LEFT JOIN 
//   task_tag te ON t.id = te.id
// LEFT JOIN 
//    e ON te.id_etiqueta = e.id_etiqueta

// WHERE 
//   t.user_id = ? AND t.isCompleted = 0

// GROUP BY 
//   t.id;
// `,
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
        'No se pudo consultar las tasks pendientes',
        { originalError: error.message, code: error.code }
      );
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  //Consulta todas las tasks del usuario tanto las que estan completadas como las que no
  async findCompletedByUserId(userId, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.execute(
//         `SELECT 
//   t.id AS tarea_id,
//   t.name AS tarea_nombre,
//   t.description AS tarea_descripcion,
//   t.scheduled_date AS tarea_fecha_programada,
//   t.created_at AS tarea_fecha_creacion,
//   t.last_update_date AS tarea_ultima_actualizacion,
//   t.isCompleted AS tarea_completada,
//   t.priority AS tarea_prioridad,
//   t.user_id AS tarea_id_usuario,

//   GROUP_CONCAT(DISTINCT te.id_tarea_etiqueta ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS tarea_etiqueta_ids,
//   GROUP_CONCAT(DISTINCT e.id_etiqueta ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_ids,
//   GROUP_CONCAT(DISTINCT e.name ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_nombres,
//   GROUP_CONCAT(e.description ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_descripciones,
//   GROUP_CONCAT(e.user_id ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_usuarios

// FROM 
//   tasks t
// LEFT JOIN 
//   task_tag te ON t.id = te.id
// LEFT JOIN 
//    e ON te.id_etiqueta = e.id_etiqueta

// WHERE 
//   t.user_id = ? AND t.isCompleted = 1

// GROUP BY 
//   t.id;
// `,
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
        'No se pudo consultar las tasks completadas',
        { originalError: error.message, code: error.code }
      );
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
}
module.exports = TaskDAO;
