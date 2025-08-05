class TareaMapper {
  constructor(tareaFactory, etiquetaMapper) {
    this.tareaFactory = tareaFactory;
    this.etiquetaMapper = etiquetaMapper;
  }

  requestToDominio(tareaRequest) {
    try {
      // Si la Etiqueta existente mandara el objeto etiqueta aue ya contiene el idUsuario y si no mandara el ob
      //objeto etiqueta y el idUsuario contenido en la tarea para que se cree con ese idUsuario la etiqueta 
      const etiquetas = (tareaRequest.etiquetas || []).map((etiqueta) => {
        if (etiqueta.idUsuario) {
          return this.etiquetaMapper.requestToDominio(etiqueta);
        } else {
          return this.etiquetaMapper.requestToDominio(
            etiqueta,
            tareaRequest.idUsuario
          );
        }
      });

      return this.tareaFactory.crear({
        idTarea: tareaRequest.idTarea || null,
        nombre: tareaRequest.nombre,
        descripcion: tareaRequest.descripcion || null,
        fechaProgramada: tareaRequest.fechaProgramada || null,
        fechaCreacion: tareaRequest.fechaCreacion || null,
        fechaUltimaActualizacion: tareaRequest.fechaUltimaActualizacion || null,
        completada: tareaRequest.completada || false,
        idUsuario: tareaRequest.idUsuario,
        prioridad: tareaRequest.prioridad || null,
        etiquetas, //  ya mapeadas como entidades de dominio
      });
    } catch (error) {
      throw new Error("Mapeo fallido: " + error.message);
    }
  }

  requestActualizarToDominio(tareaRequest) {
    try {
      return this.tareaFactory.crear({
        idTarea: tareaRequest.idTarea || null,
        nombre: tareaRequest.nombre,
        descripcion: tareaRequest.descripcion || null,
        fechaProgramada: tareaRequest.fechaProgramada || null,
        fechaCreacion: tareaRequest.fechaCreacion || null,
        fechaUltimaActualizacion: tareaRequest.fechaUltimaActualizacion || null,
        completada: tareaRequest.completada || false,
        idUsuario: tareaRequest.idUsuario,
        prioridad: tareaRequest.prioridad || null,
        etiquetas: tareaRequest.etiquetas || [],
      });
    } catch (error) {
      throw new Error("Mapeo fallido: " + error.message);
    }
  }

  tareaConEtiquetasBdToDominio(tarea) {
    //  return tareas.map((tarea) => {

    const etiquetasIds = tarea.etiquetas_ids
      ? tarea.etiquetas_ids.split(",")
      : [];
    const etiquetasNombres = tarea.etiquetas_nombres
      ? tarea.etiquetas_nombres.split(",")
      : [];
    const etiquetasDescripciones = tarea.etiquetas_descripciones
      ? tarea.etiquetas_descripciones.split(",")
      : [];
    const etiquetasUsuarios = tarea.etiquetas_usuarios
      ? tarea.etiquetas_usuarios.split(",")
      : [];
    const tareaEtiquetaIds = tarea.tarea_etiqueta_ids
      ? tarea.tarea_etiqueta_ids.split(",")
      : [];

    const etiquetas = etiquetasIds.map((id, index) => {
  

      return this.etiquetaMapper.bdConsultaJoinToDominio(
        id,
        etiquetasNombres[index],
        etiquetasDescripciones[index],
        etiquetasUsuarios[index],
        tareaEtiquetaIds[index]
      );
    });


    const nuevaTarea = this.tareaFactory.crearDesdeExistente(tarea, etiquetas);
    return nuevaTarea;
  }

}

module.exports = TareaMapper;
