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
    //  return tareas.map((task) => {

    const tagsIds = task.etiquetas_ids
      ? task.etiquetas_ids.split(',')
      : [];
    const tagsNames = task.etiquetas_nombres
      ? task.etiquetas_nombres.split(',')
      : [];
    const tagsDescriptions = task.etiquetas_descripciones
      ? task.etiquetas_descripciones.split(',')
      : [];
    const userTags = task.etiquetas_usuarios
      ? task.etiquetas_usuarios.split(',')
      : [];
    const taskTagIds = task.tarea_etiqueta_ids
      ? task.tarea_etiqueta_ids.split(',')
      : [];

    const tags = tagsIds.map((id, index) => {
  

      return this.tagMapper.dbJoinToDomain(
        id,
        tagsNames[index],
        tagsDescriptions[index],
        userTags[index],
        taskTagIds[index]
      );
    });


    const newTask = this.taskFactory.createFromExistingTask(task, tags);
    return newTask;
  }

}

module.exports = TaskMapper;
