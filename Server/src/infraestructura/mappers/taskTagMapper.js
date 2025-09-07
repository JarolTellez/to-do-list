class TaskTagMapper{

    constructor(TaskTag){
        this.TaskTag = TaskTag;
    }
    
  dbToDomain(tareaEtiquetaBD){
    return new this.TaskTag({
        id: tareaEtiquetaBD.id,
        taskId: tareaEtiquetaBD.task_id,
        tagId: tareaEtiquetaBD.tag_id,
    });
        
    
  }
}
module.exports = TaskTagMapper;