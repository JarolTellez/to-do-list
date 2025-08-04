class TareaEtiqueta{
    constructor({idTareaEtiqueta, idTarea, idEtiqueta}) {
        this.idTareaEtiqueta = idTareaEtiqueta;
        this.idTarea = idTarea;
        this.idEtiqueta = idEtiqueta;
      }

      validar(){
        const errores=[];

        if(!this.idTarea){
          errores.push({ campo: 'idTarea', mensaje: 'La etiqueta debe asigarnse a una tarea (IdTarea)' });
        }

        if(!this.idEtiqueta){
          errores.push({ campo: 'idEtiqueta', mensaje: 'Falta el id de la etiqueta' });
        }

        if (errores.length > 0) {
          throw new Error(JSON.stringify(errores)); // Lanzar errores como JSON
        }
      }
}

module.exports= TareaEtiqueta;