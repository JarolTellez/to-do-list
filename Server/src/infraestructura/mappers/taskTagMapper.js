class TaskTagMapper{

    constructor(TaskTag){
        this.TaskTag = TaskTag;
    }
    
  bdToDominio(tareaEtiquetaBD){
    return new this.TaskTag({
        idTareaEtiqueta: tareaEtiquetaBD.id_tarea_etiqueta,
        idTarea: tareaEtiquetaBD.id_tarea,
        idEtiqueta: tareaEtiquetaBD.id_etiqueta,
    });
        
    
  }
}
module.exports = TaskTagMapper;