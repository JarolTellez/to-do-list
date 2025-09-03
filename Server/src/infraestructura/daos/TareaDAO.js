const { logError } = require("../../utils/logger");
const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");

class TareaDAO  extends BaseDatabaseHandler{
  constructor(
    tareaMapper,
    conexionBD,
    DatabaseError,
    NotFoundError,
    ConflictError
  ) {
    super(conexionBD);
    this.tareaMapper = tareaMapper;
    this.DatabaseError = DatabaseError;
    this.NotFoundError = NotFoundError;
    this.ConflictError = ConflictError;
  }

  async agregarTarea(tarea, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [tareaAgregada] = await connection.execute(
        "INSERT INTO tareas (nombre,descripcion,fecha_programada,fecha_creacion,ultima_actualizacion,completada,id_usuario,prioridad) VALUES(?,?,?,?,?,?,?,?)",
        [
          tarea.nombre,
          tarea.descripcion,
          tarea.fechaProgramada,
          tarea.fechaCreacion,
          tarea.fechaUltimaActualizacion,
          tarea.completada,
          tarea.idUsuario,
          tarea.prioridad,
        ]
      );
      tarea.idTarea = tareaAgregada.insertId;

      return tarea;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw new this.ConflictError(
          "Ya existe una tarea con ese nombre para este usuario",
          { nombre: tarea.nombre, idUsuario: tarea.idUsuario }
        );
      }
      throw new this.DatabaseError("No se pudo guardar la tarea", {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async actualizarTarea(tarea, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [resultado] = await connection.execute(
        "UPDATE tareas SET nombre = ?, descripcion = ?, fecha_programada = ?, ultima_actualizacion = ?, prioridad = ? WHERE id_tarea=?",
        [
          tarea.nombre,
          tarea.descripcion,
          tarea.fechaProgramada,
          tarea.fechaUltimaActualizacion,
          tarea.prioridad,
          tarea.idTarea,
        ]
      );

      if (resultado.affectedRows === 0) {
        throw new this.NotFoundError("La tarea no existe");
      }
      return tarea;
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;

      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw new this.ConflictError("Ya existe una tarea con ese nombre");
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

  async actualizarTareaCompletada(idTarea, completada, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [resultado] = await connection.execute(
        "UPDATE tareas SET completada = ? WHERE id_tarea = ?",
        [completada, idTarea]
      );
      if (resultado.affectedRows === 0) {
        throw new this.NotFoundError("La tarea no existe");
      }

      return resultado.affectedRows;
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;

      throw new this.DatabaseError(
        "No se pudo marcar la tarea como completada",
        { originalError: error.message, code: error.code }
      );
    } finally {
      if (connection) {
       await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async eliminarTarea(idTarea, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const resultado = await connection.execute(
        "DELETE FROM tareas WHERE id_tarea = ?",
        [idTarea]
      );
      if (resultado.affectedRows === 0) {
        throw new this.NotFoundError("La tarea no existe");
      }

      return resultado[0].affectedRows;
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;

      if (error.code === "ER_ROW_IS_REFERENCED" || error.errno === 1451) {
        throw new this.ConflictError(
          "No se puede eliminar la tarea porque tiene etiquetas asociadas",
          { idTarea }
        );
      }

      throw new this.DatabaseError("No se pudo eliminar la tarea", {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async consultarTodasTareas(externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [tareas] = await connection.query("SELECT * FROM tareas");
      return tareas;
    } catch (error) {
      throw new this.DatabaseError("No se pudo consultar todas las tareas", {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      if (connection) {
        await this.releaseConnection(this.conexionBD, isExternal);
      }
    }
  }

  async consultarTareaPorNombre(nombreTarea, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [tarea] = await connection.execute(
        "SELECT * FROM tareas WHERE nombre = ?",
        [nombreTarea]
      );

      if (!tarea[0]) {
        throw new this.NotFoundError("Tarea no encontrada");
      }
      return tarea[0];
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;

      throw new this.DatabaseError("No se pudo consultar la tarea por nombre", {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async consultarTareaPorId(idTarea, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [tarea] = await connection.execute(
        "SELECT * FROM tareas WHERE id_tarea = ?",
        [idTarea]
      );

      if (!tarea[0]) {
        throw new this.NotFoundError("Tarea no encontrada");
      }
      return tarea[0];
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;

      throw new this.DatabaseError("No se pudo consultar la tarea por id", {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async consultarTareasPorIdTarea(idTarea, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [tareas] = await connection.execute(
        `SELECT 
    t.id_tarea AS tarea_id,
    t.nombre AS tarea_nombre,
    t.descripcion AS tarea_descripcion,
    t.fecha_programada AS tarea_fecha_programada,
    t.fecha_creacion AS tarea_fecha_creacion,
    t.ultima_actualizacion AS tarea_ultima_actualizacion,
    t.completada AS tarea_completada,
    t.prioridad AS tarea_prioridad,
    t.id_usuario AS tarea_id_usuario,  
  
      GROUP_CONCAT(DISTINCT te.id_tarea_etiqueta ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS tarea_etiqueta_ids,
      GROUP_CONCAT(DISTINCT e.id_etiqueta ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_ids,
      GROUP_CONCAT(DISTINCT e.nombre ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_nombres,
      GROUP_CONCAT(e.descripcion ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_descripciones,
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
        [idTarea]
      );

      if (tareas.length === 0) {
        throw new this.NotFoundError(
          "No se encontró la tarea con el id proporcionado"
        );
      }

      const tareasMappeadas = tareas.map((tarea) => {
        return this.tareaMapper.tareaConEtiquetasBdToDominio(tarea);
      });
      return tareasMappeadas;
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;

      throw new this.DatabaseError("No se pudo consultar la tarea por id", {
        originalError: error.message,
        code: error.code,
      });
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  async consultarTareaPorIdTareaUsuario(idTarea, idUsuario, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [tarea] = await connection.execute(
        "SELECT * FROM tareas WHERE id_tarea = ? AND id_usuario = ?",
        [idTarea, idUsuario]
      );

      if (!tarea[0]) {
        throw new this.NotFoundError("Tarea no encontrada para este usuario");
      }

      return tarea[0];
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;

      throw new this.DatabaseError(
        "No se pudo consultar la tarea por id y usuario",
        { originalError: error.message, code: error.code }
      );
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  //Consulta las tareas pendientes del usuario, es decir las que no estan marcadas como completadas
  async consultarTareasPendientesPorIdUsuario(idUsuario, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [tareas] = await connection.execute(
        `SELECT 
  t.id_tarea AS tarea_id,
  t.nombre AS tarea_nombre,
  t.descripcion AS tarea_descripcion,
  t.fecha_programada AS tarea_fecha_programada,
  t.fecha_creacion AS tarea_fecha_creacion,
  t.ultima_actualizacion AS tarea_ultima_actualizacion,
  t.completada AS tarea_completada,
  t.prioridad AS tarea_prioridad,
  t.id_usuario AS tarea_id_usuario,

  GROUP_CONCAT(DISTINCT te.id_tarea_etiqueta ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS tarea_etiqueta_ids,
  GROUP_CONCAT(DISTINCT e.id_etiqueta ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_ids,
  GROUP_CONCAT(DISTINCT e.nombre ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_nombres,
  GROUP_CONCAT(e.descripcion ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_descripciones,
  GROUP_CONCAT(e.id_usuario ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_usuarios

FROM 
  tareas t
LEFT JOIN 
  tarea_etiqueta te ON t.id_tarea = te.id_tarea
LEFT JOIN 
  etiquetas e ON te.id_etiqueta = e.id_etiqueta

WHERE 
  t.id_usuario = ? AND t.completada = 0

GROUP BY 
  t.id_tarea;
`,

        [idUsuario]
      );

       if (!tareas || tareas.length === 0) {
      return []; 
    }

      const tareasMappeadas = tareas.map((tarea) => {
        try {
        return this.tareaMapper.tareaConEtiquetasBdToDominio(tarea);
      } catch (error) {
        return null; 
      }
      });

      // return tareas;
      return tareasMappeadas;
    } catch (error) {
      throw new this.DatabaseError(
        "No se pudo consultar las tareas pendientes",
        { originalError: error.message, code: error.code }
      );
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }

  //Consulta todas las tareas del usuario tanto las que estan completadas como las que no
  async consultarTareasCompletadasUsuario(idUsuario, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [tareas] = await connection.execute(
        `SELECT 
  t.id_tarea AS tarea_id,
  t.nombre AS tarea_nombre,
  t.descripcion AS tarea_descripcion,
  t.fecha_programada AS tarea_fecha_programada,
  t.fecha_creacion AS tarea_fecha_creacion,
  t.ultima_actualizacion AS tarea_ultima_actualizacion,
  t.completada AS tarea_completada,
  t.prioridad AS tarea_prioridad,
  t.id_usuario AS tarea_id_usuario,

  GROUP_CONCAT(DISTINCT te.id_tarea_etiqueta ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS tarea_etiqueta_ids,
  GROUP_CONCAT(DISTINCT e.id_etiqueta ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_ids,
  GROUP_CONCAT(DISTINCT e.nombre ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_nombres,
  GROUP_CONCAT(e.descripcion ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_descripciones,
  GROUP_CONCAT(e.id_usuario ORDER BY te.id_tarea_etiqueta SEPARATOR ',') AS etiquetas_usuarios

FROM 
  tareas t
LEFT JOIN 
  tarea_etiqueta te ON t.id_tarea = te.id_tarea
LEFT JOIN 
  etiquetas e ON te.id_etiqueta = e.id_etiqueta

WHERE 
  t.id_usuario = ? AND t.completada = 1

GROUP BY 
  t.id_tarea;
`,
        [idUsuario]
      );

       if (!tareas || tareas.length === 0) {
      return []; 
    }

      const tareasMappeadas = tareas.map((tarea) => {
        try {
        return this.tareaMapper.tareaConEtiquetasBdToDominio(tarea);
      } catch (error) {
        return null; 
      }
      });

      return tareasMappeadas;
    } catch (error) {
      throw new this.DatabaseError(
        "No se pudo consultar las tareas completadas",
        { originalError: error.message, code: error.code }
      );
    } finally {
      if (connection) {
        await this.releaseConnection(connection, isExternal);
      }
    }
  }
}
module.exports = TareaDAO;
