class TaskTag{
    constructor({id, taskId, tagId}) {
        this.id = id;
        this.taskId = taskId;
        this.tagId = tagId;
      }

      validate(){
        const errors=[];

        if(!this.taskId){
          errors.push({ field: 'taskId', message: 'La etiqueta debe asigarnse a una tarea (IdTarea)' });
        }

        if(!this.tagId){
          errors.push({ field: 'tagId', message: 'Falta el id de la etiqueta' });
        }

        if (errors.length > 0) {
          throw new Error(JSON.stringify(errors)); // Lanzar errors como JSON
        }
      }
}

module.exports= TaskTag;