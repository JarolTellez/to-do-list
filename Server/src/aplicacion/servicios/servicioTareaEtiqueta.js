class ServicioTareaEtiqueta {
  constructor(tareaEtiquetaDAO) {
    this.tareaEtiquetaDAO = tareaEtiquetaDAO;
  }

  async guardarTareaEtiqueta(idTarea, idEtiqueta) {
    try {
      const idRelacion = await this.tareaEtiquetaDAO.agregarTareaEtiqueta(idTarea, idEtiqueta);
      console.log(`Relación agregada: Tarea ${idTarea} ↔ Etiqueta ${idEtiqueta}`);
      return idRelacion;
    } catch (error) {
      console.error("Error al agregar relación tarea-etiqueta:", error);
      throw error;
    }
  }

  async eliminarPorIdTarea(idTarea) {
    try {
      const eliminadas = await this.tareaEtiquetaDAO.eliminarTareaEtiquetaPorIdTarea(idTarea);
      console.log(`Relaciones eliminadas para tarea ${idTarea}: ${eliminadas}`);
      return eliminadas;
    } catch (error) {
      console.error("Error al eliminar relaciones de tarea:", error);
      throw error;
    }
  }

  async obtenerPorIdTarea(idTarea) {
    try {
      return await this.tareaEtiquetaDAO.consultarTareaEtiquetaPorIdTarea(idTarea);
    } catch (error) {
      console.error("Error al consultar relaciones de tarea:", error);
      throw error;
    }
  }

  async eliminarPorIdTareaEtiqueta(idTareaEtiqueta) {
    try {
      return await this.tareaEtiquetaDAO.eliminarTareaEtiqueta(idTareaEtiqueta);
    } catch (error) {
      console.error("Error al eliminar una relación específica:", error);
      throw error;
    }
  }
}

module.exports = ServicioTareaEtiqueta;
