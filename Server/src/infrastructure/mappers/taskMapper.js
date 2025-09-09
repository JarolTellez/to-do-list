class TaskMapper {
  constructor(taskFactory, tagMapper) {
    this.taskFactory = taskFactory;
    this.tagMapper = tagMapper;
  }

  requestToDomain(taskRequest) {
    try {
      // Si la Etiqueta existente mandara el objeto tags aue ya contiene el userId y si no mandara el ob
      //objeto tags y el userId contenido en la task para que se cree con ese userId la tags 
      const tags = (taskRequest.tags || []).map((tags) => {
        if (tags.userId) {
          return this.tagMapper.requestToDomain(tags);
        } else {
          return this.tagMapper.requestToDomain(
            tags,
            taskRequest.userId
          );
        }
      });

      return this.taskFactory.createNewTask({
        id: taskRequest.id || null,
        name: taskRequest.name,
        description: taskRequest.description || null,
        scheduledDate: taskRequest.scheduledDate || null,
        createdAt: taskRequest.createdAt || null,
        lastUpdateDate: taskRequest.lastUpdateDate || null,
        isCompleted: taskRequest.isCompleted || false,
        userId: taskRequest.userId,
        priority: taskRequest.priority || null,
        tags, //  ya mapeadas como entidades de dominio
      });
    } catch (error) {
      throw new Error('Mapeo fallido: ' + error.message);
    }
  }

  dbToDomain(taskDB){
    return this.taskFactory.newTask({
      id: taskDB.id,
      name: taskDB.name,
      description: taskDB.description,
      scheduledDate: taskDB.scheduled_date,
      createdAt: taskDB.created_At,
      lastUpdateDate: taskDB.last_update_date,
      isCompleted: taskDB.is_completed,
      userId: taskDB.userId,
      priority: taskDB.priority,
      tags:taskDB.tags 
    })
  }

  updateRequestToDominio(taskRequest) {
    try {
      return this.taskFactory.createNew({
        id: taskRequest.id || null,
        name: taskRequest.name,
        description: taskRequest.description || null,
        scheduledDate: taskRequest.scheduledDate || null,
        createdAt: taskRequest.createdAt || null,
        lastUpdateDate: taskRequest.lastUpdateDate || null,
        isCompleted: taskRequest.isCompleted || false,
        userId: taskRequest.userId,
        priority: taskRequest.priority || null,
        tags: taskRequest.tags || [],
      });
    } catch (error) {
      throw new Error('Mapeo fallido: ' + error.message);
    }
  }

  taskWithTagsDbToDomain(task) {
     const tags = task.tags ? task.tags.map(tag => 
        this.tagMapper.dbToDomain(tag)
    ) : [];

    
    const newTask = this.taskFactory.createFromExistingTask(task, tags);
    return newTask;
  }

}

module.exports = TaskMapper;
