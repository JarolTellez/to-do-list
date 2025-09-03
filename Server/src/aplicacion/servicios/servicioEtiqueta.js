const BaseDatabaseHandler = require("../../infraestructura/config/BaseDatabaseHandler");

class ServicioEtiqueta extends BaseDatabaseHandler {
  constructor(etiquetaDAO, conexionBD) {
    super(conexionBD);
    this.etiquetaDAO = etiquetaDAO;
  }

  async agregarEtiqueta(etiqueta, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const existe = await this.etiquetaDAO.consultarEtiquetaPorNombreIdUsuario(
        etiqueta.nombreEtiqueta,
        etiqueta.idUsuario,
        connection
      );

      if (existe) {
        return existe;
      }

      const etiquetaResultado = await this.etiquetaDAO.agregarEtiqueta(
        etiqueta,
        connection
      );
      return etiquetaResultado;
    }, externalConn);
  }

  async consultarEtiquetasPorIdUsuario(idUsuario, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const etiquetas = await this.etiquetaDAO.consultarEtiquetasPorIdUsuario(
        idUsuario,
        connection
      );
      return etiquetas;
    }, externalConn);
  }

  async obtenerEtiquetaPorNombre(nombreEtiqueta, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const etiqueta = await this.etiquetaDAO.consultarEtiquetasPorNombre(
        nombreEtiqueta,
        connection
      );
      return etiqueta;
    }, externalConn);
  }
}

module.exports = ServicioEtiqueta;
