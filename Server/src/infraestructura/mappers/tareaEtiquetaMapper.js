class TareaEtiquetaMapper{

    constructor(TareaEtiqueta){
        this.TareaEtiqueta = TareaEtiqueta;
    }
    
  bdToDominio(tareaEtiquetaBD){
    return new this.TareaEtiqueta({
        idTareaEtiqueta: tareaEtiquetaBD.id_tarea_etiqueta,
        idTarea: tareaEtiquetaBD.id_tarea,
        idEtiqueta: tareaEtiquetaBD.id_etiqueta,
    });
        
    
  }
}
module.exports = TareaEtiquetaMapper;