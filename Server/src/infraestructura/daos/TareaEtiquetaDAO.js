// const ConexionBD = require("../utils/conexionBD");

class TareaEtiquetaDAO {
   constructor(tareaEtiquetaMapper, conexionBD) {
    this.tareaEtiquetaMapper = tareaEtiquetaMapper;
    this.conexionBD = conexionBD;
  }

   async agregarTareaEtiqueta(idTarea, idEtiqueta) {
   // const conexionBD = ConexionBD.getInstance();
    const connection = await this.conexionBD.conectar();
    try {
      const [nuevaTareaEtiqueta] = await connection.query(
        "INSERT INTO tarea_etiqueta (id_tarea,id_etiqueta) VALUES (?,?)",
        [idTarea, idEtiqueta]
      );
      const idTareaEtiqueta = nuevaTareaEtiqueta.insertId;

      return idTareaEtiqueta;
    } catch (error) {
      console.log("Error al agregar tarea etiqueta: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

   async actualizarTareaEtiqueta(tareaEtiqueta) {
    // const conexionBD = ConexionBD.getInstance();
    const connection = await this.conexionBD.conectar();

    try {
      await connection.query(
        "UPDATE tarea_etiqueta SET id_tarea = ?, id_etiqueta = ? WHERE id_tarea_etiqueta = ?",
        [
          tareaEtiqueta.idTarea,
          tareaEtiqueta.idEtiqueta,
          tareaEtiqueta.idTareaEtiqueta,
        ]
      );

      return tareaEtiqueta;
    } catch (error) {
      console.log("Error al actualizar una tareaEtiqueta: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

   async eliminarTareaEtiqueta(idTareaEtiqueta) {
   // const conexionBD = ConexionBD.getInstance();
    const connection = await this.conexionBD.conectar();

    try {
      const [resultado] = await connection.query(
        "DELETE FROM tarea_etiqueta WHERE id_tarea_etiqueta = ? ",
        [idTareaEtiqueta]
      );
      return resultado.affectedRows;
    } catch (error) {
      console.log("Error al eliminar una tareaEtiqueta: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  //Elimina todas las relaciones de TareaEtiqueta por idTareapara eliminar todas las etiquetas de una tarea
   async eliminarTareaEtiquetasPorIdTarea(idTarea) {
   // const conexionBD = ConexionBD.getInstance();
    const connection = await this.conexionBD.conectar();

    try {
      const [resultado] = await connection.query(
        "DELETE FROM tarea_etiqueta WHERE id_tarea = ? ",
        [idTarea]
      );

      return resultado.affectedRows;
    } catch (error) {
      console.log("Error al eliminar una tareaEtiqueta: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

   async consultarTodasTareasEtiquetas() {
    //const conexionBD = ConexionBD.getInstance();
    const connection = await this.conexionBD.conectar();

    try {
      const [tareasEtiquetas] = await connection.query(
        "SELECT * FROM tarea_etiqueta"
      );
      return tareasEtiquetas;
    } catch (error) {
      console.log("Error al consultar todas las tareasEtiquetas: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

   async consultarTareaEtiquetaPorIdTarea(idTarea) {
    //const conexionBD = ConexionBD.getInstance();
    const connection = await this.conexionBD.conectar();

    console.log("SE CONSULTO");

    try {
      const [tareasEtiquetas] = await connection.query(
        "SELECT * FROM tarea_etiqueta WHERE id_tarea = ?",
        [idTarea]
      );
      return tareasEtiquetas;
    } catch (error) {
      console.log("Error al consultar una tarea por nombre: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = TareaEtiquetaDAO;
