const conexionBD = require("../config/conexionBD");

class EtiquetaDAO {
  static async agregarEtiqueta(etiqueta) {
    const connection = await conexionBD.conectar();

    try {
      const [result] = await connection.query(
        "INSERT INTO etiqueta (nombre,descripcion) VALUES(?,?)",
        [etiqueta.nombre, etiqueta.descripcion]
      );
      etiqueta.idEtiqueta = result.insertId;
      return etiqueta;
    } catch (error) {
      console.log("Error al agregar el usuario: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async actualizarEtiqueta(etiqueta) {
    const connection = await conexionBD.conectar();
    try {
      await connection.query(
        "UPDATE etiqueta SET nombre = ?, descripcion = ?",
        [etiqueta.nombre, etiqueta.descripcion]
      );
      return etiqueta;
    } catch (error) {
      console.log("Error al actualizar etiqueta: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async eliminarEtiqueta(idEtiqueta) {
    const connection = await conexionBD.conectar();

    try {
      await connection.query("DELETE FROM etiqueta WHERE idEtiqueta = ?", [
        idEtiqueta,
      ]);
    } catch (error) {
      console.log("Error al eliminar la etiqueta: ", error);
      throw error;
    } finally {
      await connection.release();
    }
  }

  static async consultarTodasEtiquetas() {
    const connection = await conexionBD.conectar();
    try {
      const [etiquetas] = await connection.query("SELECT * FROM etiqueta");
      return etiquetas;
    } catch (error) {
      console.log("Eror al consultar etiquetas: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async consultarEtiquetaPorNombre(nombreEtiqueta) {
    const connection = await conexionBD.conectar();
    try {
      const [etiqueta] = await connection.query(
        "SELECT * FROM etiqueta WHERE nombre = ?",
        [nombreEtiqueta]
      );
      return etiqueta[0];
    } catch (error) {
      console.log("Error al consultar etiqueta por nombre: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async consultarEtiquetaPorId(idEtiqueta) {
    const connection = await conexionBD.conectar();
    try {
      const [etiqueta] = await connection.query(
        "SELECT * FROM etiqueta WHERE idEtiqueta = ?",
        [idEtiqueta]
      );
      return etiqueta[0];
    } catch (error) {
      console.log("Error al consultar etiqueta por id: ", error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = EtiquetaDAO;
