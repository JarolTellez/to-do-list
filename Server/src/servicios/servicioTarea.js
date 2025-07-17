const tareasDAO = require("../datos/TareaDAO");
const Tarea = require("../dominio/Tarea");
const etiquetaService = require("../servicios/servicioEtiqueta");

class TareaService {
  async agregarTarea(tareaData) {
    const {
      nombre,
      descripcion,
      fechaProgramada,
      fechaCreacion,
      fechaUltimaActualizacion,
      completada,
      idUsuario,
      prioridad,
      etiquetas,
    } = tareaData;

    const tarea = new Tarea(
      null,
      nombre,
      descripcion,
      fechaProgramada,
      fechaCreacion,
      fechaUltimaActualizacion,
      completada,
      idUsuario,
      prioridad
    );

    tarea.validar();
    const tareaAgregada = await tareasDAO.agregarTarea(tarea);

    if (etiquetas && etiquetas.length > 0) {
      await etiquetaService.agregarEtiquetas(etiquetas, tareaAgregada.idTarea, idUsuario);
    }

    const tareaConEtiquetas = await tareasDAO.consultarTareasPorIdTarea(tareaAgregada.idTarea);
    return this.procesarTareasConEtiquetas(tareaConEtiquetas)[0];
  }

  async eliminarTarea(idTarea, idUsuario) {
    const tareaExistente = await tareasDAO.consultarTareaPorIdTareaUsuario(idTarea, idUsuario);

    if (!tareaExistente) {
      throw new Error(`No se encontró la tarea con id ${idTarea}`);
    }

    await etiquetaService.eliminarEtiquetasPorIdTarea(idTarea);
    const eliminada = await tareasDAO.eliminarTarea(idTarea);

    if (eliminada <= 0) {
      throw new Error("No se pudo eliminar la tarea");
    }
  }

  async actualizarTarea(tareaData) {
    const {
      idTarea,
      nombre,
      descripcion,
      fechaProgramada,
      fechaUltimaActualizacion,
      idUsuario,
      prioridad,
      etiquetasAnteriores,
      etiquetasNuevas
    } = tareaData;

    const tarea = new Tarea(
      idTarea,
      nombre,
      descripcion,
      fechaProgramada,
      null,
      fechaUltimaActualizacion,
      null,
      idUsuario,
      prioridad
    );

    const tareaExistente = await tareasDAO.consultarTareaPorId(idTarea);
    if (!tareaExistente) {
      throw new Error(`No se encontró la tarea con el id: ${idTarea}.`);
    }

    tarea.validar();
    await tareasDAO.actualizarTarea(tarea);

    const etiquetasParaAgregar = etiquetasNuevas.filter(etiquetaNueva => 
      !etiquetasAnteriores.some(etiquetaAnterior => etiquetaAnterior.nombre === etiquetaNueva.nombre));
    const etiquetasParaEliminar = etiquetasAnteriores.filter(etiquetaAnterior => 
      !etiquetasNuevas.some(etiquetaNueva => etiquetaNueva.nombre === etiquetaAnterior.nombre));

    if (etiquetasParaAgregar.length > 0) {
      await etiquetaService.agregarEtiquetas(etiquetasParaAgregar, idTarea, idUsuario);
    }

    if (etiquetasParaEliminar.length > 0) {
      await etiquetaService.eliminarEtiquetas(etiquetasParaEliminar);
    }

    const tareaActualizadaConsulta = await tareasDAO.consultarTareasPorIdTarea(tarea.idTarea);
    return this.procesarTareasConEtiquetas(tareaActualizadaConsulta)[0];
  }

  async actualizarTareaCompletada(idTarea, completada) {
    const tareaExistente = await tareasDAO.consultarTareaPorId(idTarea);
    if (!tareaExistente) {
      throw new Error(`No se encontró la tarea con el id: ${idTarea}.`);
    }

    const respuesta = await tareasDAO.actualizarTareaCompletada(idTarea, completada);
    if (respuesta <= 0) {
      throw new Error("No se pudo actualizar la tarea");
    }

    return await tareasDAO.consultarTareaPorId(idTarea);
  }

  async consultarTareasPorIdUsuario(idUsuario) {
    const tareasPendientes = await tareasDAO.consultarTareasPorIdUsuario(idUsuario);
    const tareasCompletadas = await tareasDAO.consultarTareasCompletadasUsuario(idUsuario);

    return {
      tareasPendientes: this.procesarTareasConEtiquetas(tareasPendientes),
      tareasCompletadas: this.procesarTareasConEtiquetas(tareasCompletadas)
    };
  }

  procesarTareasConEtiquetas(tareas) {
    return tareas.map((tarea) => {
      const etiquetas_ids = tarea.etiquetas_ids ? tarea.etiquetas_ids.split(",") : [];
      const etiquetas_nombres = tarea.etiquetas_nombres ? tarea.etiquetas_nombres.split(",") : [];
      const etiquetas_usuarios = tarea.etiquetas_usuarios ? tarea.etiquetas_usuarios.split(",") : [];
      const tarea_etiqueta_ids = tarea.tarea_etiqueta_ids ? tarea.tarea_etiqueta_ids.split(",") : [];

      const etiquetas = etiquetas_ids.map((id, index) => ({
        idEtiqueta: id,
        nombre: etiquetas_nombres[index],
        idUsuario: etiquetas_usuarios[index],
        idTareaEtiqueta: tarea_etiqueta_ids[index]
      }));

      const nuevaTarea = new Tarea(
        tarea.tarea_id,
        tarea.tarea_nombre,
        tarea.tarea_descripcion || "",
        tarea.tarea_fecha_programada ? new Date(tarea.tarea_fecha_programada).toLocaleString() : null,
        tarea.tarea_fecha_creacion ? new Date(tarea.tarea_fecha_creacion).toLocaleString() : new Date(),
        tarea.tarea_ultima_actualizacion ? new Date(tarea.tarea_ultima_actualizacion).toLocaleString() : new Date(),
        tarea.tarea_completada || false,
        tarea.etiquetas_usuarios ? tarea.etiquetas_usuarios.split(",")[0] : null,
        tarea.tarea_prioridad
      );

      nuevaTarea.etiquetas = etiquetas;
      return nuevaTarea;
    });
  }
}

module.exports = new TareaService();