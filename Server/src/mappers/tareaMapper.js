
class TareaMapper {
    constructor(tareaFactory, etiquetaMapper) {
    this.tareaFactory = tareaFactory;
    this.etiquetaMapper = etiquetaMapper;
  }

   requestToDominio(tareaRequest) {
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

   tareaEtiquetasDbJoinToDominio(tarea){
    //  return tareas.map((tarea) => {
     
      const etiquetasIds = tarea.etiquetas_ids ? tarea.etiquetas_ids.split(",") : [];
       const etiquetasNombres = tarea.etiquetas_nombres ? tarea.etiquetas_nombres.split(",") : [];
      const etiquetasUsuarios = tarea.etiquetas_usuarios ? tarea.etiquetas_usuarios.split(",") : [];
       const tareaEtiquetaIds = tarea.tarea_etiqueta_ids ? tarea.tarea_etiqueta_ids.split(",") : [];

      const etiquetas = etiquetasIds.map((id, index) => {
        // idEtiqueta: id,
        // nombre: etiquetas_nombres[index],
        // idUsuario: etiquetas_usuarios[index],
        // idTareaEtiqueta: tarea_etiqueta_ids[index]
         return this.etiquetaMapper.dbToDomain(
                id,
                etiquetasNombres[index],
                etiquetasUsuarios[index],
                tareaEtiquetaIds[index]
            )
          
  });
    console.log("ETIQUETAS: ", etiquetas);
    //EtiquetaMapper.dbToDomain(etiquetasIds,etiquetasNombres,etiquetasUsuarios,tareaEtiquetaIds)
    

      const nuevaTarea = this.tareaFactory.crearDesdeExistente(
        tarea,
        etiquetas
      
      );
      console.log("NUEVA TAREA", nuevaTarea);

    //  nuevaTarea.etiquetas = etiquetas;
      return nuevaTarea;
    
  }

//   static toRespuesta(tarea) {
//     return {
//       idTarea: tarea.idTarea,
//       nombre: tarea.nombre,
//       descripcion: tarea.descripcion,
//       fechaProgramada: tarea.fechaProgramada?.toISOString() || null,
//       fechaCreacion: tarea.fechaCreacion.toISOString(),
//       fechaUltimaActualizacion: tarea.fechaUltimaActualizacion.toISOString(),
//       completada: tarea.completada,
//       idUsuario: tarea.idUsuario,
//       prioridad: tarea.prioridad,
//       etiquetas: tarea.etiquetas.map((e) => ({
//         idEtiqueta: e.idEtiqueta,
//         nombreEtiqueta: e.nombreEtiqueta,
//         idUsuario: e.idUsuario,
//       })),
//     };
//   }
}

module.exports = TareaMapper;
