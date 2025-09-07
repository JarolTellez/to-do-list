class TaskFactory {
  constructor(Task) {
    this.Task = Task;
  }
// REFACTOR el metodo paseAndValidateDate hacer un metodo aparte o ponerlo en utils***
  createNewTask(task) {
    //  const parseAndValidateDate = (fecha) => fecha ? new Date(fecha) : null;
   const parseAndValidateDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
};

    const newTask = new this.Task({
      id: task.id || null,
      name: task.name,
      description: task.description || null,
      scheduledDate: parseAndValidateDate(task.scheduledDate),
      createdAt: parseAndValidateDate(task.createdAt) || new Date(),
      lastUpdateDate:
        parseAndValidateDate(task.lastUpdateDate) || new Date(),
      isCompleted: task.isCompleted,
      userId: task.userId,
      priority: task.priority || null,
      tags: task.tags,
    });

    newTask.validate();
    return newTask;
  }

  createFromExistingTask(task, tags) {
     const parseAndValidateDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
};

// estos names son los establecidos en la consulta del DAO, MODIFICAR***
    const newTask = new this.Task({
      id: task.tarea_id || null,
      name: task.tarea_nombre,
      description: task.tarea_descripcion || null,
      scheduledDate: parseAndValidateDate(task.tarea_fecha_programada),
      createdAt: parseAndValidateDate(task.tarea_fecha_creacion) || new Date(),
      lastUpdateDate:
        parseAndValidateDate(task.tarea_ultima_actualizacion) || new Date(),
      isCompleted: task.tarea_completada,
      userId: task.tarea_id_usuario,
      priority: task.tarea_prioridad || null,
      tags,
    });

    newTask.validate();
    return newTask;
  }
}

module.exports = TaskFactory;
