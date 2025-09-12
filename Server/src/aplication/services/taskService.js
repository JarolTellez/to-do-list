const BaseDatabaseHandler = require("../../infrastructure/config/BaseDatabaseHandler");

class TaskService extends BaseDatabaseHandler {
  constructor({
    taskDAO,
    tagService,
    taskTagService,
    connectionDB,
    NotFoundError,
    validateRequired,
  }) {
    super(connectionDB);
    this.taskDAO = taskDAO;
    this.taskTagService = taskTagService;
    this.tagService = tagService;
    this.NotFoundError = NotFoundError;
    this.validateRequired=validateRequired;
  }

  async createTask(task, externalConn = null) {
    this.validateRequired(["task"], { task });
    return this.withTransaction(async (connection) => {
      const newTask = await this.taskDAO.create(task, connection);

      if (Array.isArray(task.tags)) {
        for (const tag of task.tags) {
          let tagId;

          if (tag.id) {
            tagId = tag.id;
          } else {
            const savedTag = await this.tagService.createTag(tag, connection);
            tagId = savedTag.id;
          }

          await this.taskTagService.createTaskTag(
            newTask.id,
            tagId,
            connection
          );
        }
      }

      return newTask;
    }, externalConn);
  }

  async updateTask(task, externalConn = null) {
    this.validateRequired(["task"], { task });
    return this.withTransaction(async (connection) => {
      const existingTask = await this.taskDAO.findByIdAndUserId(task.id, task.userId, connection);
      if (!existingTask) {
        throw new this.NotFoundError("Tarea no encontrada", {
          attemptedData: { taskId: task.id, name: task.name },
        });
      }

      // Actualizar información principal de la tarea
     const result= await this.taskDAO.update(task, connection);
     if(!result){
      throw new this.NotFoundError("Tarea no encontrada para actualizar",{attemptedData:{taskId:task.taskId,userId:task.userId}})
     }

      for (const tag of task.tags) {
        if (tag.toDelete === true && tag.taskTagId) {
          await this.taskTagService.deleteById(tag.taskTagId, connection);
          continue;
        }

        //Crear nueva tag si no existe
        if (!tag.exists) {
          const createdTag = await this.tagService.createTag(tag, connection);

          if (createdTag && createdTag.id) {
            await this.taskTagService.createTaskTag(
              task.id,
              createdTag.id,
              connection
            );
          } 
        } else if (!tag.taskTagId) {
          // Si la tag ya existe pero no está relacionada, se crea la relación
          await this.taskTagService.createTaskTag(task.id, tag.id, connection);
        }
      }

      //  Consultar y retornar task actualizada
      const taskResult = await this.taskDAO.findByIdAndUserId(task.id, task.userId, connection);
      if (!taskResult) {
        throw new this.NotFoundError("Tarea no encontrada", {
          attemptedData: { taskId: task.id, name: task.name },
        });
      }
      return taskResult;
    }, externalConn);
  }

  async deleteTask(taskId, userId, externalConn = null) {
    this.validateRequired(["taskId", "userId"], { taskId, userId });
    return this.withTransaction(async (connection) => {
      const existingTask = await this.taskDAO.findByIdAndUserId(
        taskId,
        userId,
        connection
      );
      // if(existingTask.tags.length>0){
      // const deletedTaskTag = await this.taskTagService.deleteAllByTaskId(
      //   taskId,
      //   connection
      // );
      // if (!deletedTaskTag) {
      //   throw new this.NotFoundError("Tarea no encontrada", {
      //     attemptedData: { taskId, userId },
      //   });
      // }
      // }
      
      const deletedTask = await this.taskDAO.delete(taskId,userId, connection);
      if (!deletedTask) {
        throw new this.NotFoundError("Tarea no encontrada", {
          attemptedData: { taskId, userId },
        });
      }
      return deletedTask;
    }, externalConn);
  }

  async completeTask(taskId, completed,userId, externalConn = null) {
    return this.withTransaction(async (connection) => {
      // const existingTask = await this.taskDAO.findById(taskId, connection);
      // if (!existingTask) {
      //   throw new Error(`No se encontró la task con el id: ${taskId}.`);
      // }

      const result = await this.taskDAO.updateCompleted(
        taskId,
        completed,
        userId,
        connection
      );
    
      const updatedTask = await this.taskDAO.findByIdAndUserId(taskId, userId, connection);
        if (!updatedTask|| !result) {
        throw new this.NotFoundError("Tarea no encontrada", {
          attemptedData: {taskId},
        });
      }

      return updatedTask;
    }, externalConn);
  }

  async getAllTasksByUserId(userId, options={}, externalConn = null) {
    return this.withTransaction(async (connection) => {
       const { 
            pendingPage = 1, 
            pendingLimit = 2,
            completedPage = 1,
            completedLimit = 2
        } = options;
      const pendingTasks = await this.taskDAO.findPendingByUserId(
        userId,
        pendingPage,
        pendingLimit,
        connection
      );
      const completedTasks = await this.taskDAO.findCompletedByUserId(
        userId,
        completedPage,
        completedLimit,
        connection
      );

      return { pendingTasks, completedTasks };
    }, externalConn);
  }

  

  
}

module.exports = TaskService;
