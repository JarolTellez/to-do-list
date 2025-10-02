class TaskService {
  constructor({
    taskDAO,
    taskMapper,
    userTagMapper,
    tagService,
    taskTagService,
    userTagService,
    dbManager,
    errorFactory,
    validator,
    appConfig,
    paginationHelper
  }) {
    this.dbManager=dbManager;
    this.taskDAO = taskDAO;
    this.taskMapper = taskMapper;
    this.userTagMapper=userTagMapper;
    this.taskTagService = taskTagService;
    this.tagService = tagService;
    this.userTagService = userTagService;
    this.errorFactory = errorFactory;
    this.validator = validator;
    this.appConfig = appConfig;
    this.paginationHelper=paginationHelper;
  }

  async createTask(createTaskRequestDTO, externalDbClient=null) {
    this.validator.validateRequired(["createTaskRequestDTO"], {
      createTaskRequestDTO,
    });
    return this.dbManager.withTransaction(async (dbClient) => {
      const taskDomain =
        this.taskMapper.createRequestDTOToDomain(createTaskRequestDTO);
      const newTask = await this.taskDAO.create(taskDomain, dbClient);

      if (Array.isArray(taskDomain.taskTags)) {
        await this.#processTaskTags(
          newTask.id,
          newTask.userId,
          taskDomain.taskTags,
          dbClient
        );
      }

      const consultedTask = await this.taskDAO.findWithTagsByIdAndUserId(
        newTask.id,
        newTask.userId,
        dbClient
      );
      return consultedTask;
    }, externalDbClient);
  }

  async #processTaskTags(taskId, userId, taskTags, externalDbClient = null) {
    for (const taskTag of taskTags) {
      taskTag.assignTaskId(taskId);

      if (!taskTag.tag.id) {
        const createdTag = await this.tagService.createTag(
          taskTag.tag,
          externalDbClient
        );
        taskTag.assignTag(createdTag);
      }

      const userTag = this.userTagMapper.fromTagAndUserToDomain(
        taskTag.tag.id,
        userId
      );

      await this.userTagService.createUserTag(userTag, externalDbClient);

      await this.taskTagService.createTaskTag(taskTag, externalDbClient);
    }

  }

  async updateTask(task, externalDbClient = null) {
    this.validator.validateRequired(["task"], { task });
    return this.dbManager.withTransaction(async (dbClient) => {
      const existingTask = await this.taskDAO.findByIdAndUserId(
        task.id,
        task.userId,
        dbClient
      );
      if (!existingTask) {
        throw this.errorFactory.createNotFoundError("Tarea no encontrada", {
          attemptedData: { taskId: task.id, name: task.name },
        });
      }

  
      const result = await this.taskDAO.update(task, dbClient);
      if (!result) {
        throw this.errorFactory.createNotFoundError(
          "Tarea no encontrada para actualizar",
          { attemptedData: { taskId: task.taskId, userId: task.userId } }
        );
      }

      for (const tag of task.tags) {
        if (tag.toDelete === true && tag.taskTagId) {
          await this.taskTagService.deleteById(tag.taskTagId, dbClient);
          continue;
        }

        if (!tag.exists) {
          const createdTag = await this.tagService.createTag(tag, dbClient);

          if (createdTag && createdTag.id) {
            await this.taskTagService.createTaskTag(
              task.id,
              createdTag.id,
              dbClient
            );
          }
        } else if (!tag.taskTagId) {
          await this.taskTagService.createTaskTag(task.id, tag.id, dbClient);
        }
      }

      const taskResult = await this.taskDAO.findByIdAndUserId(
        task.id,
        task.userId,
        dbClient
      );
      if (!taskResult) {
        throw this.errorFactory.createNotFoundError("Tarea no encontrada", {
          attemptedData: { taskId: task.id, name: task.name },
        });
      }
      return taskResult;
    }, externalDbClient);
  }

  async deleteTask(taskId, userId, externalDbClient = null) {
    this.validator.validateRequired(["taskId", "userId"], { taskId, userId });
    return this.dbManager.withTransaction(async (dbClient) => {
      const existingTask = await this.taskDAO.findByIdAndUserId(
        taskId,
        userId,
        dbClient
      );
      // if(existingTask.tags.length>0){
      // const deletedTaskTag = await this.taskTagService.deleteAllByTaskId(
      //   taskId,
      //   dbClient
      // );
      // if (!deletedTaskTag) {
      //   throw new this.NotFoundError("Tarea no encontrada", {
      //     attemptedData: { taskId, userId },
      //   });
      // }
      // }

      const deletedTask = await this.taskDAO.delete(taskId, userId, dbClient);
      if (!deletedTask) {
        throw this.errorFactory.createNotFoundError("Tarea no encontrada", {
          attemptedData: { taskId, userId },
        });
      }
      return deletedTask;
    }, externalDbClient);
  }

  async completeTask(taskId, completed, userId, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      // const existingTask = await this.taskDAO.findById(taskId, dbClient);
      // if (!existingTask) {
      //   throw new Error(`No se encontró la task con el id: ${taskId}.`);
      // }

      const result = await this.taskDAO.updateCompleted(
        taskId,
        completed,
        userId,
        dbClient
      );

      const updatedTask = await this.taskDAO.findByIdAndUserId(
        taskId,
        userId,
        dbClient
      );
      if (!updatedTask || !result) {
        throw this.errorFactory.createNotFoundError("Tarea no encontrada", {
          attemptedData: { taskId },
        });
      }

      return updatedTask;
    }, externalDbClient);
  }

  async getAllTasksByUserId(userId, options = {}, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
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
        dbClient
      );
      const completedTasks = await this.taskDAO.findCompletedByUserId(
        userId,
        completedPage,
        completedLimit,
        dbClient
      );

      return { pendingTasks, completedTasks };
    }, externalDbClient);
  }
}

module.exports = TaskService;
