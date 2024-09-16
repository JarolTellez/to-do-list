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
}

module.exports = EtiquetaDAO;
