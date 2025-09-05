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
        'INSERT INTO tareas (name,description,fecha_programada,fecha_creacion,ultima_actualizacion,isCompleted,id_usuario,priority) VALUES(?,?,?,?,?,?,?,?)',
        [
          rows.name,
          rows.description,
          rows.scheduleDate,
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
      throw new this.DatabaseError('No se pudo guardar la rows', {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async update(rows, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        'UPDATE tareas SET name = ?, description = ?, fecha_programada = ?, ultima_actualizacion = ?, priority = ? WHERE id_tarea=?',
        [
          rows.name,
          rows.description,
          rows.scheduleDate,
          rows.lastUpdateDate,
          rows.priority,
          rows.id,
        ]
      );

      if (result.affectedRows === 0) {
        throw new this.NotFoundError('La rows no existe');
      }
      return rows;
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
        'UPDATE tareas SET isCompleted = ? WHERE id_tarea = ?',
        [isCompleted, id]
      );
      if (result.affectedRows === 0) {
        throw new this.NotFoundError('La rows no existe');
      }

      return result.affectedRows;
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;

      throw new this.DatabaseError(
        'No se pudo marcar la rows como isCompleted',
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
        'DELETE FROM tareas WHERE id_tarea = ?',
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
          'No se puede eliminar la rows porque tiene etiquetas asociadas',
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
      const [rows] = await connection.query('SELECT * FROM tareas');
      return rows;
    } catch (error) {
      throw new this.DatabaseError('No se pudo consultar todas las tareas', {
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
        'SELECT * FROM tareas WHERE name = ?',
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
  //       'SELECT * FROM tareas WHERE id_tarea = ?',
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
        `SELECT 
    t.id_tarea AS tarea_id,
    t.name AS tarea_nombre,
    t.description AS tarea_descripcion,
    t.fecha_programada AS tarea_fecha_programada,
    t.fecha_creacion AS tarea_fecha_creacion,
    t.ultima_actualizacion AS tarea_ultima_actualizacion,
    t.isCompleted AS tarea_completada,
    t.priority AS tarea_prioridad,
    t.id_usuario AS tarea_id_usuario,  
  
      GROUP_CONCAT(DISTINCT te.id_tarea_etiqueta ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS tarea_etiqueta_ids,
      GROUP_CONCAT(DISTINCT e.id_etiqueta ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_ids,
      GROUP_CONCAT(DISTINCT e.name ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_nombres,
      GROUP_CONCAT(e.description ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_descripciones,
      GROUP_CONCAT(e.id_usuario ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_usuarios
FROM 
    tareas t
LEFT JOIN 
    tarea_etiqueta te ON t.id_tarea = te.id_tarea
LEFT JOIN 
    etiquetas e ON te.id_etiqueta = e.id_etiqueta
WHERE 
    t.id_tarea = ?
GROUP BY 
    t.id_tarea`,
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

      throw new this.DatabaseError('No se pudo consultar la rows por id', {
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
        'SELECT * FROM tareas WHERE id_tarea = ? AND id_usuario = ?',
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

  //Consulta las tareas pendientes del usuario, es decir las que no estan marcadas como completadas
  async findPendingByUserId(userId, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [rows] = await connection.execute(
        `SELECT 
  t.id_tarea AS tarea_id,
  t.name AS tarea_nombre,
  t.description AS tarea_descripcion,
  t.fecha_programada AS tarea_fecha_programada,
  t.fecha_creacion AS tarea_fecha_creacion,
  t.ultima_actualizacion AS tarea_ultima_actualizacion,
  t.isCompleted AS tarea_completada,
  t.priority AS tarea_prioridad,
  t.id_usuario AS tarea_id_usuario,

  GROUP_CONCAT(DISTINCT te.id_tarea_etiqueta ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS tarea_etiqueta_ids,
  GROUP_CONCAT(DISTINCT e.id_etiqueta ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_ids,
  GROUP_CONCAT(DISTINCT e.name ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_nombres,
  GROUP_CONCAT(e.description ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_descripciones,
  GROUP_CONCAT(e.id_usuario ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_usuarios

FROM 
  tareas t
LEFT JOIN 
  tarea_etiqueta te ON t.id_tarea = te.id_tarea
LEFT JOIN 
  etiquetas e ON te.id_etiqueta = e.id_etiqueta

WHERE 
  t.id_usuario = ? AND t.isCompleted = 0

GROUP BY 
  t.id_tarea;
`,

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

      // return tareas;
      return mappedTasks;
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar las tareas pendientes',
        { originalError: error.message, code: error.code }
      );
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  //Consulta todas las tareas del usuario tanto las que estan completadas como las que no
  async findCompletedByUserId(userId, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.execute(
        `SELECT 
  t.id_tarea AS tarea_id,
  t.name AS tarea_nombre,
  t.description AS tarea_descripcion,
  t.fecha_programada AS tarea_fecha_programada,
  t.fecha_creacion AS tarea_fecha_creacion,
  t.ultima_actualizacion AS tarea_ultima_actualizacion,
  t.isCompleted AS tarea_completada,
  t.priority AS tarea_prioridad,
  t.id_usuario AS tarea_id_usuario,

  GROUP_CONCAT(DISTINCT te.id_tarea_etiqueta ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS tarea_etiqueta_ids,
  GROUP_CONCAT(DISTINCT e.id_etiqueta ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_ids,
  GROUP_CONCAT(DISTINCT e.name ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_nombres,
  GROUP_CONCAT(e.description ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_descripciones,
  GROUP_CONCAT(e.id_usuario ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_usuarios

FROM 
  tareas t
LEFT JOIN 
  tarea_etiqueta te ON t.id_tarea = te.id_tarea
LEFT JOIN 
  etiquetas e ON te.id_etiqueta = e.id_etiqueta

WHERE 
  t.id_usuario = ? AND t.isCompleted = 1

GROUP BY 
  t.id_tarea;
`,
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
        'No se pudo consultar las tareas completadas',
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
