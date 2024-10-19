const ConexionBD = require("../utils/conexionBD");

class TareaDAO {
  static async agregarTarea(tarea) {
    const conexionBD = new ConexionBD();
    const connection = await conexionBD.conectar();

    try {
      const [tareaAgregada] = await connection.query(
        "INSERT INTO tarea (nombre,descripcion,fechaCreacion,ultimaActualizacion,completada,idUsuario,prioridad) VALUES(?,?,?,?,?,?,?)",
        [
          tarea.nombre,
          tarea.descripcion,
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
      console.log("Error al agregar una tarea: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async actualizarTarea(tarea) {
    const conexionBD = new ConexionBD();
    const connection = await conexionBD.conectar();

    try {
     const [resultado]= await connection.query(
        "UPDATE tarea SET nombre = ?, descripcion = ?, ultimaActualizacion = ?, prioridad = ? WHERE idTarea=?",
        [
          tarea.nombre,
          tarea.descripcion,
          tarea.fechaUltimaActualizacion,
          tarea.prioridad,
          tarea.idTarea,
        ]
      );

      console.log("desde dao",resultado);
      return tarea;
    } catch (error) {
      console.log("Error al actualizar una tarea: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async actualizarTareaCompletada(idTarea,completada) {
    const conexionBD = new ConexionBD();
    const connection = await conexionBD.conectar();
    try {
     const [resultado]= await connection.query(
        "UPDATE tarea SET completada = ? WHERE idTarea = ?",
        [
          completada,
          idTarea
        ]
      );
    
      return resultado.affectedRows;
    } catch (error) {
      console.log("Error al actualizar una tarea: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async eliminarTarea(idTarea) {
    const conexionBD = new ConexionBD();
    const connection = await conexionBD.conectar();

    try {
      const resultado = await connection.query(
        "DELETE FROM tarea WHERE idTarea = ?",
        [idTarea]
      );
      return resultado.affectedRows;
    } catch (error) {
      console.log("Error al eliminar una tarea: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async consultarTodasTareas() {
    const conexionBD = new ConexionBD();
    const connection = await conexionBD.conectar();

    try {
      const [tareas] = await connection.query("SELECT * FROM tarea");
      return tareas;
    } catch (error) {
      console.log("Error al consultar todas las tareas: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async consultarTareaPorNombre(nombreTarea) {
    const conexionBD = new ConexionBD();
    const connection = await conexionBD.conectar();

    try {
      const [tarea] = await connection.query(
        "SELECT * FROM tarea WHERE nombre = ?",
        [nombreTarea]
      );
      return tarea[0];
    } catch (error) {
      console.log("Error al consultar una tarea por nombre: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }
 
  static async consultarTareaPorId(idTarea) {
    const conexionBD = new ConexionBD();
    const connection = await conexionBD.conectar();

    try {
      const [tarea] = await connection.query(
        "SELECT * FROM tarea WHERE idTarea = ?",
        [idTarea]
      );
      return tarea[0];
    } catch (error) {
      console.log("Error al consultar una tarea por id: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async consultarTareasPorIdTarea(idTarea) {
    const conexionBD = new ConexionBD();
    const connection = await conexionBD.conectar();
  
    try {
      console.log("Consultando tarea con id:", idTarea); // Imprime el idTarea
      
      const [tareas] = await connection.query(
        `SELECT 
            t.idTarea AS tarea_id,
            t.nombre AS tarea_nombre,
            t.descripcion AS tarea_descripcion,
            t.fechaCreacion AS tarea_fecha_creacion,
            t.ultimaActualizacion AS tarea_ultima_actualizacion,
            t.completada AS tarea_completada,
            t.prioridad AS tarea_prioridad,
            GROUP_CONCAT(e.idEtiqueta) AS etiquetas_ids,
            GROUP_CONCAT(e.nombre) AS etiquetas_nombres,
            GROUP_CONCAT(e.idUsuario) AS etiquetas_usuarios
        FROM 
            tarea t
        LEFT JOIN 
            tareaEtiqueta te ON t.idTarea = te.idTarea
        LEFT JOIN 
            etiqueta e ON te.idEtiqueta = e.idEtiqueta
        WHERE 
            t.idTarea = ?
        GROUP BY 
            t.idTarea;`,
        [idTarea]
      );
      
      
      
      if (tareas.length === 0) {
          console.log("No se encontraron tareas para el id proporcionado.");
      }
      
      return tareas;
    } catch (error) {
      console.log("Error al consultar una tarea por id: ", error.message);
      console.error("Detalles del error: ", error);
      throw error;
    } finally {
      connection.release();
    }
}


static async consultarTareasPorIdUsuario(idUsuario) {
  const conexionBD = new ConexionBD();
  const connection = await conexionBD.conectar();

  try {
    const [tareas] = await connection.query(
      `SELECT 
      t.idTarea AS tarea_id,
      t.nombre AS tarea_nombre,
      t.descripcion AS tarea_descripcion,
      t.fechaCreacion AS tarea_fecha_creacion,
      t.ultimaActualizacion AS tarea_ultima_actualizacion,
      t.completada AS tarea_completada,
      t.prioridad AS tarea_prioridad,
      GROUP_CONCAT(e.idEtiqueta) AS etiquetas_ids,
      GROUP_CONCAT(e.nombre) AS etiquetas_nombres,
      GROUP_CONCAT(e.idUsuario) AS etiquetas_usuarios
   FROM 
      tarea t
   LEFT JOIN 
      tareaEtiqueta te ON t.idTarea = te.idTarea
   LEFT JOIN 
      etiqueta e ON te.idEtiqueta = e.idEtiqueta
   WHERE 
      t.idUsuario = ? AND t.completada = 0
   GROUP BY 
      t.idTarea;`,
      [idUsuario]
    );
    return tareas;
  } catch (error) {
    console.log("Error al consultar una tarea por id: ", error);
    throw error;
  } finally {
    connection.release();
  }
}
}
module.exports = TareaDAO;
