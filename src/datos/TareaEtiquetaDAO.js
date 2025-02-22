const ConexionBD = require("../utils/conexionBD");

class TareaEtiquetaDAO {
  static async agregarTareaEtiqueta(tareaEtiqueta) {
    const conexionBD = ConexionBD.getInstance();
    const connection = await conexionBD.conectar();
    try {
      const [nuevaTareaEtiqueta] = await connection.query(
        "INSERT INTO tareaetiqueta (idTarea,idEtiqueta) VALUES (?,?)",
        [tareaEtiqueta.idTarea, tareaEtiqueta.idEtiqueta]
      );
      tareaEtiqueta.idTareaEtiqueta = nuevaTareaEtiqueta.insertId;

      return tareaEtiqueta;
    } catch (error) {
      console.log("Error al agregar tarea etiqueta: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async actualizarTareaEtiqueta(tareaEtiqueta) {
    const conexionBD = ConexionBD.getInstance();
    const connection = await conexionBD.conectar();

    try {
      await connection.query(
        "UPDATE tareaetiqueta SET idTarea = ?, idEtiqueta = ? WHERE idTareaEtiqueta = ?",
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

  static async eliminarTareaEtiqueta(idTareaEtiqueta) {
    const conexionBD = ConexionBD.getInstance();
    const connection = await conexionBD.conectar();

    try {
      const [resultado] = await connection.query(
        "DELETE FROM tareaetiqueta WHERE idTareaEtiqueta = ? ",
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

  static async eliminarTareaEtiquetaPorIdTarea(idTarea) {
    const conexionBD = ConexionBD.getInstance();
    const connection = await conexionBD.conectar();

    try {
      const [resultado] = await connection.query(
        "DELETE FROM tareaetiqueta WHERE idTarea = ? ",
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

  static async consultarTodasTareasEtiquetas() {
    const conexionBD = ConexionBD.getInstance();
    const connection = await conexionBD.conectar();

    try {
      const [tareasEtiquetas] = await connection.query(
        "SELECT * FROM tareaetiqueta"
      );
      return tareasEtiquetas;
    } catch (error) {
      console.log("Error al consultar todas las tareasEtiquetas: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async consultarTareaEtiquetaPorIdTarea(idTarea) {
    const conexionBD = ConexionBD.getInstance();
    const connection = await conexionBD.conectar();

    try {
      const [tareasEtiquetas] = await connection.query(
        "SELECT * FROM tareaetiqueta WHERE idTarea = ?",
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
