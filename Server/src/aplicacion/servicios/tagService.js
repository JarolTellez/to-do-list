const BaseDatabaseHandler = require('../../infraestructura/config/BaseDatabaseHandler');

class TagService extends BaseDatabaseHandler {
  constructor({tagDAO, connectionDB}) {
    super(connectionDB);
    this.tagDAO = tagDAO;
  }

  async agregarEtiqueta(etiqueta, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const existe = await this.tagDAO.consultarEtiquetaPorNombreIdUsuario(
        etiqueta.nombre,
        etiqueta.idUsuario,
        connection
      );

      if (existe) {
        return existe;
      }

      const etiquetaResultado = await this.tagDAO.agregarEtiqueta(
        etiqueta,
        connection
      );
      return etiquetaResultado;
    }, externalConn);
  }

  async consultarEtiquetasPorIdUsuario(idUsuario, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const etiquetas = await this.tagDAO.consultarEtiquetasPorIdUsuario(
        idUsuario,
        connection
      );
      return etiquetas;
    }, externalConn);
  }

  async obtenerEtiquetaPorNombre(nombre, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const etiqueta = await this.tagDAO.consultarEtiquetasPorNombre(
        nombre,
        connection
      );
      return etiqueta;
    }, externalConn);
  }
}

module.exports = TagService;
