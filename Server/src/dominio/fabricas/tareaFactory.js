class TareaFactory{

  constructor(Tarea ){
    this.Tarea = Tarea;
    

  }

     crear(tarea){
      
   
  //  const procesarFecha = (fecha) => fecha ? new Date(fecha) : null;
const procesarFecha = (fecha) => {
  if (!fecha) return null;
  const d = new Date(fecha);
  return isNaN(d.getTime()) ? null : d;
};


    const nuevaTarea = new this.Tarea({
      idTarea: tarea.idTarea || null,
      nombre: tarea.nombre,
      descripcion: tarea.descripcion || null,
      fechaProgramada: procesarFecha(tarea.fechaProgramada),
      fechaCreacion: procesarFecha(tarea.fechaCreacion) || new Date(),
      fechaUltimaActualizacion: procesarFecha(tarea.fechaUltimaActualizacion) || new Date(),
      completada: tarea.completada,
      idUsuario: tarea.idUsuario,
      prioridad: tarea.prioridad || null,
      etiquetas: tarea.etiquetas
     });

    nuevaTarea.validar();
    return nuevaTarea;
  }
     crearDesdeExistente(tarea, etiquetas){
    // const parametros = {
    //   fechaCreacion: new Date(),
    //   fechaUltimaActualizacion: new Date(),
    //   completada: false,
    //   etiquetas: [],
    //   ...tarea
    // };
  
    
    //const procesarFecha = (fecha) => fecha ? new Date(fecha) : null;
      const procesarFecha = (fecha) => {
    if (!fecha) return null;
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? null : d;
  };

    // const etiquetas = parametros.etiquetas.map(etiquetaData => {
    //   return new Etiqueta(
    //     etiquetaData.idEtiqueta || null,
    //     etiquetaData.nombreEtiqueta,
    //     etiquetaData.idUsuario || parametros.idUsuario,
    //     etiquetaData.idTareaEtiqueta || null
    //   );
    // });

    const nuevaTarea = new this.Tarea({
      idTarea: tarea.tarea_id || null,
      nombre: tarea.tarea_nombre,
      descripcion: tarea.tarea_descripcion || null,
      fechaProgramada: procesarFecha(tarea.tarea_fecha_programada),
      fechaCreacion: procesarFecha(tarea.tarea_fecha_creacion) || new Date(),
      fechaUltimaActualizacion: procesarFecha(tarea.tarea_ultima_actualizacion) || new Date(),
      completada: tarea.tarea_completada,
      idUsuario: tarea.tarea_id_usuario,
      prioridad: tarea.tarea_prioridad || null,
      etiquetas
     });

      

    nuevaTarea.validar();
    return nuevaTarea;
  }

   
}


module.exports = TareaFactory;
