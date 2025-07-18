const etiquetaDAO = require("../datos/EtiquetaDAO");
const tareaEtiquetaDAO = require("../datos/TareaEtiquetaDAO");
const Etiqueta = require("../dominio/Etiqueta");


class EtiquetaService {
  async agregarEtiquetas(etiquetas, idTarea, idUsuario) {
    try {
      for (const etiqueta of etiquetas) {
        if (!etiqueta.hasOwnProperty("idEtiqueta")) {
          const etiquetaNueva = new Etiqueta(null, etiqueta.nombre, idUsuario);
          etiquetaNueva.validar();

          const nuevaEtiqueta = await this.agregarEtiqueta(etiquetaNueva);

          if (nuevaEtiqueta) {
            const tareaEtiqueta = new TareaEtiqueta(null, idTarea, nuevaEtiqueta.idEtiqueta);
            await this.agregarTareaEtiqueta(tareaEtiqueta);
          } else {
            const existente = await etiquetaDAO.consultarEtiquetaPorNombreIdUsuario(etiqueta.nombre, idUsuario);
            const tareaEtiqueta = new TareaEtiqueta(null, idTarea, existente.id_etiqueta);
            await this.agregarTareaEtiqueta(tareaEtiqueta);
          }
        } else {
          const tareaEtiqueta = new TareaEtiqueta(null, idTarea, etiqueta.idEtiqueta);
          tareaEtiqueta.validar();
          await this.agregarTareaEtiqueta(tareaEtiqueta);
        }
      }
    } catch (error) {
      console.error("Error en agregarEtiquetas: ", error);
      throw error;
    }
  }

  async agregarEtiqueta(etiqueta) {
    try {
      const existe = await etiquetaDAO.consultarEtiquetaPorNombreIdUsuario(
        etiqueta.nombreEtiqueta, etiqueta.idUsuario
      );
      if (existe) {
        return null;
      }

      return await etiquetaDAO.agregarEtiqueta(etiqueta);
    } catch (error) {
      console.log("Error al agregar la etiqueta: ", error);
      throw error;
    }
  }

  async agregarTareaEtiqueta(tareaEtiqueta) {
    try {
      return await tareaEtiquetaDAO.agregarTareaEtiqueta(tareaEtiqueta);
    } catch (error) {
      console.log("Error al agregar la TareaEtiqueta: ", error);
      throw error;
    }
  }

  async consultarEtiquetasPorIdUsuario(idUsuario) {
    return await etiquetaDAO.consultarEtiquetaPorIdUsuario(idUsuario);
  }

  async eliminarEtiquetas(etiquetas) {
    try {
      for (const etiqueta of etiquetas) {
        await tareaEtiquetaDAO.eliminarTareaEtiqueta(etiqueta.idTareaEtiqueta);
      }
    } catch (error) {
      console.error("Error al eliminar tareaEtiqueta: ", error);
      throw error;
    }
  }

  async eliminarEtiquetasPorIdTarea(idTarea) {
    try {
      const etiquetas = await tareaEtiquetaDAO.consultarTareaEtiquetaPorIdTarea(idTarea);
      if (etiquetas && etiquetas.length > 0) {
        return await tareaEtiquetaDAO.eliminarTareaEtiquetaPorIdTarea(idTarea);
      }
      return 0;
    } catch (error) {
      console.error("Error al eliminar tareaEtiqueta: ", error);
      throw error;
    }
  }

  async obtenerEtiquetaPorNombre(nombreEtiqueta) {
    try {
      return await etiquetaDAO.consultarEtiquetaPorNombre(nombreEtiqueta);
    } catch (error) {
      console.error("Error al obtener la etiqueta por nombre: ", error);
      throw error;
    }
  }
}

module.exports = new EtiquetaService();