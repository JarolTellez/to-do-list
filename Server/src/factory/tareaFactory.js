const Tarea = require("../dominio/Tarea");
const Etiqueta = require("../dominio/Etiqueta");

class TareaFactory{

     crear(tarea){
      
   
    const procesarFecha = (fecha) => fecha ? new Date(fecha) : null;


    const nuevaTarea = new Tarea(
      tarea.idTarea || null,
      tarea.nombre,
      tarea.descripcion || null,
      procesarFecha(tarea.fechaProgramada),
      procesarFecha(tarea.fechaCreacion) || new Date(),
      procesarFecha(tarea.fechaUltimaActualizacion) || new Date(),
      tarea.completada,
      tarea.idUsuario,
      tarea.prioridad || null,
      tarea.etiquetas
    );

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
  
    
    const procesarFecha = (fecha) => fecha ? new Date(fecha) : null;

    // const etiquetas = parametros.etiquetas.map(etiquetaData => {
    //   return new Etiqueta(
    //     etiquetaData.idEtiqueta || null,
    //     etiquetaData.nombreEtiqueta,
    //     etiquetaData.idUsuario || parametros.idUsuario,
    //     etiquetaData.idTareaEtiqueta || null
    //   );
    // });

    const nuevaTarea = new Tarea(
      tarea.tarea_id || null,
      tarea.tarea_nombre,
      tarea.tarea_descripcion || null,
      procesarFecha(tarea.tarea_fecha_programada),
      procesarFecha(tarea.tarea_fecha_creacion) || new Date(),
      procesarFecha(tarea.tarea_ultima_actualizacion) || new Date(),
      tarea.tarea_completada,
      tarea.tarea_id_usuario,
      tarea.tarea_prioridad || null,
      etiquetas
    );

      

    nuevaTarea.validar();
    return nuevaTarea;
  }
}


module.exports = TareaFactory;
