class TaskMapper {
  constructor(taskFactory, tagMapper, taskTagMapper) {
    this.taskFactory = taskFactory;
    this.tagMapper = tagMapper;
    this.taskTagMapper = taskTagMapper;
  }

  requestToDomain(taskRequest) {
    try {
      // Si la Etiqueta existente mandara el objeto tags aue ya contiene el userId y si no mandara el ob
      //objeto tags y el userId contenido en la task para que se cree con ese userId la tags
      const tags = (taskRequest.tags || []).map((tags) => {
        if (tags.userId) {
          return this.tagMapper.requestToDomain(tags);
        } else {
          return this.tagMapper.requestToDomain(tags, taskRequest.userId);
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
      throw new Error("Mapeo fallido: " + error.message);
    }
  }

  dbToDomain(row) {
    return this.taskFactory.newTask({
      id: row.task_id,
      name: row.task_name,
      description: row.task_description,
      scheduledDate: row.scheduled_date,
      createdAt: row.task_created_at,
      lastUpdateDate: row.last_update_date,
      isCompleted: row.is_completed,
      userId: row.user_id,
      priority: row.priority,
      taskTags: [],
    });
  }

  dbToDomainWithTags(rows) {
  if (!rows || rows.length === 0) return null;

  const tasksMap = new Map();

  rows.forEach(row => {
    let task = tasksMap.get(row.task_id);

    // Si la tarea aún no está en el mapa, la creamos
    if (!task) {
      task = this.dbToDomain(row);
      tasksMap.set(row.task_id, task);
    }

    // Si hay taskTag, creamos la entidad TaskTag y la asociamos
    if (row.task_tag_id) {
      const taskTag = this.taskTagMapper.dbToDomain(row);
      task.addTaskTag(taskTag);
    }
  });

  // Retornamos todas las tareas con sus taskTags agrupadas
  return Array.from(tasksMap.values());
}


  // dbToDomainWithTags(rows){
  //   if(rows.length===0) return null;
  //   //Unica tarea en todas las rows
  //   const task = this.dbToDomain(rows[0]);

  //   task.taskTags= rows.filter(r=>r.task_tag_id).map(r=>taskTagMapper.dbToDomain(r));
  //   return task;
  // }


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
      throw new Error("Mapeo fallido: " + error.message);
    }
  }

  taskWithTagsDbToDomain(task) {
    const tags = task.tags
      ? task.tags.map((tag) => this.tagMapper.dbToDomain(tag))
      : [];

    const newTask = this.taskFactory.createFromExistingTask(task, tags);
    return newTask;
  }

  tasksWithTagsFromJoinResult(joinRows) {
    if (!joinRows || joinRows.length === 0) {
      return [];
    }

    const tasksMap = new Map();

    joinRows.forEach((row) => {
      if (!tasksMap.has(row.id)) {
        tasksMap.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          scheduled_date: row.scheduled_date,
          created_at: row.created_at,
          last_update_date: row.last_update_date,
          is_completed: row.is_completed,
          user_id: row.user_id,
          priority: row.priority,
          tags: [],
        });
      }

      if (row.tag_id) {
        tasksMap.get(row.id).tags.push({
          id: row.tag_id,
          task_tag_id: row.task_tag_id,
          name: row.tag_name,
          description: row.tag_description,
          user_id: row.tag_user_id,
        });
      }
    });

    return Array.from(tasksMap.values())
      .map((taskData) => {
        try {
          return this.taskWithTagsDbToDomain(taskData);
        } catch (error) {
          console.error("Error mapping task from join result:", error);
          return null;
        }
      })
      .filter((task) => task !== null);
  }
}

module.exports = TaskMapper;
