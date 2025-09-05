class TaskTag{
    constructor({id, taskId, tagId}) {
        this.id = id;
        this.taskId = taskId;
        this.tagId = tagId;
      }

      validar(){
        const errores=[];

        if(!this.taskId){
          errores.push({ campo: 'taskId', mensaje: 'La etiqueta debe asigarnse a una tarea (IdTarea)' });
        }

        if(!this.tagId){
          errores.push({ campo: 'tagId', mensaje: 'Falta el id de la etiqueta' });
        }

        if (errores.length > 0) {
          throw new Error(JSON.stringify(errores)); // Lanzar errores como JSON
        }
      }
}

module.exports= TaskTag;