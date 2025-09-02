const { logError } = require('../../utils/logger');


class TareaDAO {
    constructor(tareaMapper, conexionBD, DatabaseError) {
    this.tareaMapper = tareaMapper;
    this.conexionBD = conexionBD;
    this.DatabaseError = DatabaseError;
  }


   async agregarTarea(tarea) {
    const connection = await this.conexionBD.conectar();

    try {
      const [tareaAgregada] = await connection.query(
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
       throw new this.DatabaseError("No se pudo guardar la tarea");
    } finally {
      if(connection){
      connection.release();
      }
    }
  }

  async actualizarTarea(tarea) {
    const connection = await this.conexionBD.conectar();

    try {
     const [resultado]= await connection.query(
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

      //console.log("desde dao",resultado);
      return tarea;
    } catch (error) {
        throw new this.DatabaseError("No se pudo actualizar la tarea");
    } finally {
      if(connection){
        connection.release();
        }
    }
  }

  async actualizarTareaCompletada(idTarea,completada) {
    const connection = await this.conexionBD.conectar();
    try {
     const [resultado]= await connection.query(
        "UPDATE tareas SET completada = ? WHERE id_tarea = ?",
        [
          completada,
          idTarea
        ]
      );
    
      return resultado.affectedRows;
    } catch (error) {
       throw new this.DatabaseError("No se pudo marcar la tarea como completada");
    } finally {
      if(connection){
      connection.release();
      }
    }
  }

   async eliminarTarea(idTarea) {
    const connection = await this.conexionBD.conectar();

    try {
      const resultado= await connection.query(
        "DELETE FROM tareas WHERE id_tarea = ?",
        [idTarea]
      );
      return resultado[0].affectedRows;
    } catch (error) {
        throw new this.DatabaseError("No se pudo eliminar la tarea");
    } finally {
      if(connection){
      connection.release();
      }
    }
  }

   async consultarTodasTareas() {
    const connection = await this.conexionBD.conectar();

    try {
      const [tareas] = await connection.query("SELECT * FROM tareas");
      return tareas;
    } catch (error) {
        throw new this.DatabaseError("No se pudo consultar todas las tareas");
    } finally {
      if(connection){
      connection.release();
      }
    }
  }

   async consultarTareaPorNombre(nombreTarea) {
    const connection = await this.conexionBD.conectar();

    try {
      const [tarea] = await connection.query(
        "SELECT * FROM tareas WHERE nombre = ?",
        [nombreTarea]
      );
      return tarea[0];
    } catch (error) {
       throw new this.DatabaseError("No se pudo consultar la tarea por nombre");
    } finally {
      if(connection){
      connection.release();
      }
    }
  }
 
 async consultarTareaPorId(idTarea) {
    const connection = await this.conexionBD.conectar();

    try {
      const [tarea] = await connection.query(
        "SELECT * FROM tareas WHERE id_tarea = ?",
        [idTarea]
      );
      return tarea[0];
    } catch (error) {
        throw new DatabaseError("No se pudo consultarla tarea por id");
    } finally {
      if(connection){
      connection.release();
      }
    }
  }

  async consultarTareasPorIdTarea(idTarea) {
    const connection = await this.conexionBD.conectar();
  
    try {
      
      const [tareas] = await connection.query(
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
          console.log("No se encontraron tareas para el id proporcionado.");
      }
      console.log("TAREAS CONSULTADAS DAO: ", tareas);
      const tareasMappeadas= tareas.map((tarea) => {
   
    return this.tareaMapper.tareaConEtiquetasBdToDominio(tarea);
   });
      return tareasMappeadas;
    } catch (error) {
        throw new DatabaseError("No se pudo consultar la tarea por idTarea");
    } finally {
      if(connection){
      connection.release();
      }
    }
}

 async consultarTareaPorIdTareaUsuario(idTarea,idUsuario) {
  const connection = await this.conexionBD.conectar();

  try {
    const [tarea] = await connection.query(
      "SELECT * FROM tareas WHERE id_tarea = ? AND id_usuario = ?",
      [idTarea,idUsuario]
    );
    return tarea[0];
  } catch (error) {
      throw new DatabaseError("No se pudo actualizar la tarea por idTareaUsuario");
  } finally {
    if(connection){
    connection.release();
    }
  }
}

//Consulta las tareas pendientes del usuario, es decir las que no estan marcadas como completadas
 async consultarTareasPendientesPorIdUsuario(idUsuario) {
  const connection = await this.conexionBD.conectar();

  try {
    const [tareas] = await connection.query(
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
`
 
,
      [idUsuario]
    );
   
 
   const tareasMappeadas= tareas.map((tarea) => {

    return this.tareaMapper.tareaConEtiquetasBdToDominio(tarea);
   });

   // return tareas;
   return tareasMappeadas;
  } catch (error) {
      throw new DatabaseError("No se pudo consultar las tareas pendientes por idUsuario");
  } finally {
    if(connection){
    connection.release();
    }
  }
}

//Consulta todas las tareas del usuario tanto las que estan completadas como las que no
 async consultarTareasCompletadasUsuario(idUsuario) {
  const connection = await this.conexionBD.conectar();
  try {
    const [tareas] = await connection.query( 
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
`
, [idUsuario]);
const tareasMappeadas= tareas.map((tarea) => {
   
    return this.tareaMapper.tareaConEtiquetasBdToDominio(tarea);
   });
   // return tareas;
   return tareasMappeadas;
  } catch (error) {
     throw new DatabaseError("No se pudo consultar las tareas completadas por idUsuario");
  } finally {
    if(connection){
    connection.release();
    }
  }
}


}
module.exports = TareaDAO;
