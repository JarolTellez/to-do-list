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

  async createTask(createTaskRequestDTO) {
    this.validator.validateRequired(["createTaskRequestDTO"], {
      createTaskRequestDTO,
    });
    return this.dbManager.withTransaction(async (tx) => {
      const taskDomain =
        this.taskMapper.createRequestDTOToDomain(createTaskRequestDTO);
      const newTask = await this.taskDAO.create(taskDomain, tx);

      if (Array.isArray(taskDomain.taskTags)) {
        await this.#processTaskTags(
          newTask.id,
          newTask.userId,
          taskDomain.taskTags,
          tx
        );
      }

      const consultedTask = this.taskDAO.findWithTagsByIdAndUserId(
        newTask.id,
        newTask.userId,
        tx
      );
      return consultedTask;
    }, transactionClient);
  }

  async #processTaskTags(taskId, userId, taskTags, tx) {
    for (const taskTag of taskTags) {
      taskTag.assignTaskId(taskId);

      if (!taskTag.tag.id) {
        const createdTag = await this.tagService.createTag(
          taskTag.tag,
          tx
        );
        taskTag.assignTag(createdTag);
      }

      const userTag = this.userTagMapper.fromTagAndUserToDomain(
        taskTag.tag.id,
        userId
      );

      await this.userTagService.createUserTag(userTag, tx);

      await this.taskTagService.createTaskTag(taskTag, tx);
    }
  }

  async updateTask(task, transactionClient = null) {
    this.validator.validateRequired(["task"], { task });
    return this.dbManager.withTransaction(async (tx) => {
      const existingTask = await this.taskDAO.findByIdAndUserId(
        task.id,
        task.userId,
        tx
      );
      if (!existingTask) {
        throw this.errorFactory.createNotFoundError("Tarea no encontrada", {
          attemptedData: { taskId: task.id, name: task.name },
        });
      }

  
      const result = await this.taskDAO.update(task, tx);
      if (!result) {
        throw this.errorFactory.createNotFoundError(
          "Tarea no encontrada para actualizar",
          { attemptedData: { taskId: task.taskId, userId: task.userId } }
        );
      }

      for (const tag of task.tags) {
        if (tag.toDelete === true && tag.taskTagId) {
          await this.taskTagService.deleteById(tag.taskTagId, tx);
          continue;
        }

        if (!tag.exists) {
          const createdTag = await this.tagService.createTag(tag, tx);

          if (createdTag && createdTag.id) {
            await this.taskTagService.createTaskTag(
              task.id,
              createdTag.id,
              tx
            );
          }
        } else if (!tag.taskTagId) {
          await this.taskTagService.createTaskTag(task.id, tag.id, tx);
        }
      }

      const taskResult = await this.taskDAO.findByIdAndUserId(
        task.id,
        task.userId,
        tx
      );
      if (!taskResult) {
        throw this.errorFactory.createNotFoundError("Tarea no encontrada", {
          attemptedData: { taskId: task.id, name: task.name },
        });
      }
      return taskResult;
    }, transactionClient);
  }

  async deleteTask(taskId, userId, transactionClient = null) {
    this.validator.validateRequired(["taskId", "userId"], { taskId, userId });
    return this.dbManager.withTransaction(async (tx) => {
      const existingTask = await this.taskDAO.findByIdAndUserId(
        taskId,
        userId,
        tx
      );
      // if(existingTask.tags.length>0){
      // const deletedTaskTag = await this.taskTagService.deleteAllByTaskId(
      //   taskId,
      //   tx
      // );
      // if (!deletedTaskTag) {
      //   throw new this.NotFoundError("Tarea no encontrada", {
      //     attemptedData: { taskId, userId },
      //   });
      // }
      // }

      const deletedTask = await this.taskDAO.delete(taskId, userId, tx);
      if (!deletedTask) {
        throw this.errorFactory.createNotFoundError("Tarea no encontrada", {
          attemptedData: { taskId, userId },
        });
      }
      return deletedTask;
    }, transactionClient);
  }

  async completeTask(taskId, completed, userId, transactionClient = null) {
    return this.dbManager.withTransaction(async (tx) => {
      // const existingTask = await this.taskDAO.findById(taskId, tx);
      // if (!existingTask) {
      //   throw new Error(`No se encontró la task con el id: ${taskId}.`);
      // }

      const result = await this.taskDAO.updateCompleted(
        taskId,
        completed,
        userId,
        tx
      );

      const updatedTask = await this.taskDAO.findByIdAndUserId(
        taskId,
        userId,
        tx
      );
      if (!updatedTask || !result) {
        throw this.errorFactory.createNotFoundError("Tarea no encontrada", {
          attemptedData: { taskId },
        });
      }

      return updatedTask;
    }, transactionClient);
  }

  async getAllTasksByUserId(userId, options = {}, transactionClient = null) {
    return this.dbManager.withTransaction(async (tx) => {
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
        tx
      );
      const completedTasks = await this.taskDAO.findCompletedByUserId(
        userId,
        completedPage,
        completedLimit,
        tx
      );

      return { pendingTasks, completedTasks };
    }, transactionClient);
  }
}

module.exports = TaskService;
