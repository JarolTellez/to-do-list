class ServicioEtiqueta {
  constructor(etiquetaDAO, etiquetaMapper) {
    this.etiquetaDAO = etiquetaDAO;
  }

  async agregarEtiqueta(etiqueta) {
    try {
      const existe = await this.etiquetaDAO.consultarEtiquetaPorNombreIdUsuario(
        etiqueta.nombreEtiqueta,
        etiqueta.idUsuario
      );

      if (existe) {
        return existe;
      }

      return await this.etiquetaDAO.agregarEtiqueta(etiqueta);
    } catch (error) {
      console.log("Error al agregar la etiqueta: ", error);
      throw error;
    }
  }

  async consultarEtiquetasPorIdUsuario(idUsuario) {
    return await this.etiquetaDAO.consultarEtiquetaPorIdUsuario(idUsuario);
  }

  async obtenerEtiquetaPorNombre(nombreEtiqueta) {
    try {
      return await this.etiquetaDAO.consultarEtiquetaPorNombre(nombreEtiqueta);
    } catch (error) {
      console.error("Error al obtener la etiqueta por nombre: ", error);
      throw error;
    }
  }
}

module.exports = ServicioEtiqueta;
