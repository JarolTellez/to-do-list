class TaskService {
  constructor({
    taskDAO,
    taskMapper,
    userTagMapper,
    tagService,
    taskTagService,
    userTagService,
    connectionDb,
    errorFactory,
    validator,
    appConfig,
  }) {
    this.connectionDb=connectionDb;
    this.taskDAO = taskDAO;
    this.taskMapper = taskMapper;
    this.userTagMapper=userTagMapper;
    this.taskTagService = taskTagService;
    this.tagService = tagService;
    this.userTagService = userTagService;
    this.errorFactory = errorFactory;
    this.validator = validator;
    this.appConfig = appConfig;
  }

  async createTask(createTaskRequestDTO) {
    this.validator.validateRequired(["createTaskRequestDTO"], {
      createTaskRequestDTO,
    });
    return this.connectionDb.executeTransaction(async (connection) => {
      const taskDomain =
        this.taskMapper.createRequestDTOToDomain(createTaskRequestDTO);
      const newTask = await this.taskDAO.create(taskDomain, connection);

      if (Array.isArray(taskDomain.taskTags)) {
        await this.#processTaskTags(
          newTask.id,
          newTask.userId,
          taskDomain.taskTags,
          connection
        );
      }

      const consultedTask = this.taskDAO.findWithTagsByIdAndUserId(
        newTask.id,
        newTask.userId,
        connection
      );
      return consultedTask;
    }, externalConn);
  }

  async #processTaskTags(taskId, userId, taskTags, connection) {
    for (const taskTag of taskTags) {
      taskTag.assignTaskId(taskId);

      if (!taskTag.tag.id) {
        const createdTag = await this.tagService.createTag(
          taskTag.tag,
          connection
        );
        taskTag.assignTag(createdTag);
      }

      const userTag = this.userTagMapper.fromTagAndUserToDomain(
        taskTag.tag.id,
        userId
      );

      await this.userTagService.createUserTag(userTag, connection);

      await this.taskTagService.createTaskTag(taskTag, connection);
    }
  }

  async updateTask(task, externalConn = null) {
    this.validator.validateRequired(["task"], { task });
    return this.connectionDb.executeTransaction(async (connection) => {
      const existingTask = await this.taskDAO.findByIdAndUserId(
        task.id,
        task.userId,
        connection
      );
      if (!existingTask) {
        throw this.errorFactory.createNotFoundError("Tarea no encontrada", {
          attemptedData: { taskId: task.id, name: task.name },
        });
      }

  
      const result = await this.taskDAO.update(task, connection);
      if (!result) {
        throw this.errorFactory.createNotFoundError(
          "Tarea no encontrada para actualizar",
          { attemptedData: { taskId: task.taskId, userId: task.userId } }
        );
      }

      for (const tag of task.tags) {
        if (tag.toDelete === true && tag.taskTagId) {
          await this.taskTagService.deleteById(tag.taskTagId, connection);
          continue;
        }

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
          await this.taskTagService.createTaskTag(task.id, tag.id, connection);
        }
      }

      const taskResult = await this.taskDAO.findByIdAndUserId(
        task.id,
        task.userId,
        connection
      );
      if (!taskResult) {
        throw this.errorFactory.createNotFoundError("Tarea no encontrada", {
          attemptedData: { taskId: task.id, name: task.name },
        });
      }
      return taskResult;
    }, externalConn);
  }

  async deleteTask(taskId, userId, externalConn = null) {
    this.validator.validateRequired(["taskId", "userId"], { taskId, userId });
    return this.connectionDb.executeTransaction(async (connection) => {
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

      const deletedTask = await this.taskDAO.delete(taskId, userId, connection);
      if (!deletedTask) {
        throw this.errorFactory.createNotFoundError("Tarea no encontrada", {
          attemptedData: { taskId, userId },
        });
      }
      return deletedTask;
    }, externalConn);
  }

  async completeTask(taskId, completed, userId, externalConn = null) {
    return this.connectionDb.executeTransaction(async (connection) => {
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

      const updatedTask = await this.taskDAO.findByIdAndUserId(
        taskId,
        userId,
        connection
      );
      if (!updatedTask || !result) {
        throw this.errorFactory.createNotFoundError("Tarea no encontrada", {
          attemptedData: { taskId },
        });
      }

      return updatedTask;
    }, externalConn);
  }

  async getAllTasksByUserId(userId, options = {}, externalConn = null) {
    return this.connectionDb.executeTransaction(async (connection) => {
      const {
        pendingPage = 1,
        pendingLimit = 2,
        completedPage = 1,
        completedLimit = 2,
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
