class TaskService {
  constructor({
    taskDAO,
    taskMapper,
    taskTagMapper,
    userTagMapper,
    tagService,
    userService,
    taskTagService,
    userTagService,
    dbManager,
    errorFactory,
    validator,
    appConfig,
    paginationHelper,
  }) {
    this.dbManager = dbManager;
    this.taskDAO = taskDAO;
    this.taskTagMapper = taskTagMapper;
    this.taskMapper = taskMapper;
    this.userTagMapper = userTagMapper;
    this.taskTagService = taskTagService;
    this.tagService = tagService;
    this.userService = userService;
    this.userTagService = userTagService;
    this.errorFactory = errorFactory;
    this.validator = validator;
    this.appConfig = appConfig;
    this.paginationHelper = paginationHelper;
  }

  async createTask(createTaskRequestDTO, externalDbClient = null) {
    this.validator.validateRequired(["createTaskRequestDTO"], {
      createTaskRequestDTO,
    });

    return this.dbManager.withTransaction(async (dbClient) => {
      const taskDomain =
        this.taskMapper.createRequestDTOToDomain(createTaskRequestDTO);
      console.log(
        "Task domain inicial:",
        JSON.stringify(taskDomain.toJSON(), null, 2)
      );

      // Extracts tags
      const mixedTags = taskDomain.taskTags
        .map((taskTag) => taskTag.tag)
        .filter((tag) => tag.name && typeof tag.name === "string");

      // Process mixed tags (existing and new) and return final tag ids
      const tagIds = await this.userService.processMixedTagsForTask(
        taskDomain.userId,
        mixedTags,
        dbClient
      );

      taskDomain.setTaskTags([]);
      // Create complete taskTag  with their ids
      tagIds.forEach((tagId) => {
        const taskTag = this.taskTagMapper.createFromTagId(
          {
            taskId: null,
            tagId: tagId,
          },
          this.errorFactory
        );
        taskDomain.addTaskTag(taskTag);
      });

      console.log(
        "Task domain después de reconstruir tags:",
        JSON.stringify(taskDomain.toJSON(), null, 2)
      );

      // save task in db
      const newTask = await this.taskDAO.createWithTags(taskDomain, dbClient);

      return newTask;
    }, externalDbClient);
  }

  async updateTask(updateTaskRequestDTO, externalDbClient = null) {
    this.validator.validateRequired(["updateTaskRequestDTO"], {
      updateTaskRequestDTO,
    });

    return this.dbManager.withTransaction(async (dbClient) => {
      const existingTask = await this.taskDAO.findWithTagsByIdAndUserId(
        updateTaskRequestDTO.id,
        updateTaskRequestDTO.userId,
        dbClient
      );

      if (!existingTask) {
        throw this.errorFactory.createNotFoundError("Tarea no encontrada", {
          attemptedData: {
            taskId: updateTaskRequestDTO.id,
            userId: updateTaskRequestDTO.userId,
          },
        });
      }
      const taskDomain = this.taskMapper.updateDTOToDomain(
        updateTaskRequestDTO,
        existingTask
      );

      // get only the tags(mixed because can be existing or not)
      const mixedTags = taskDomain.taskTags
        .map((tt) => tt.tag)
        .filter((tag) => tag.name && typeof tag.name === "string");

      // Process mixed tags (existing and new) and return final tag ids
      const tagIds = await this.userService.processMixedTagsForTask(
        taskDomain.userId,
        mixedTags,
        dbClient
      );

      const currentTagIds = existingTask.taskTags.map((tt) => tt.tagId);
      const newTagIds = tagIds;

      const tagsToAdd = newTagIds.filter(
        (tagId) => !currentTagIds.includes(tagId)
      );
      const tagsToRemove = currentTagIds.filter(
        (tagId) => !newTagIds.includes(tagId)
      );

      if (tagsToRemove.length > 0) {
        await this.taskDAO.removeTaskTags(
          taskDomain.id,
          tagsToRemove,
          dbClient
        );
      }

      if (tagsToAdd.length > 0) {
        await this.taskDAO.addTaskTags(taskDomain.id, tagsToAdd, dbClient);
      }
      const updatedTask = await this.taskDAO.updateBasicInfo(
        taskDomain,
        dbClient
      );

      if (!updatedTask) {
        throw this.errorFactory.createNotFoundError(
          "Tarea no encontrada para actualizar",
          {
            attemptedData: {
              taskId: updateTaskRequestDTO.id,
              userId: updateTaskRequestDTO.userId,
            },
          }
        );
      }
      const finalTask = await this.taskDAO.findWithTagsByIdAndUserId(
        taskDomain.id,
        taskDomain.userId,
        dbClient
      );

      return finalTask;
    }, externalDbClient);
  }

  async deleteTask(taskId, userId, externalDbClient = null) {
    this.validator.validateRequired(["taskId", "userId"], { taskId, userId });
    return this.dbManager.withTransaction(async (dbClient) => {
      const existingTask = await this.taskDAO.findWithTagsByIdAndUserId(
        taskId,
        userId,
        dbClient
      );

      if (!existingTask) {
        throw this.errorFactory.createNotFoundError("Tarea no encontrada", {
          attemptedData: { taskId, userId },
        });
      }

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
      const result = await this.taskDAO.updateCompleted(
        taskId,
        completed,
        userId,
        dbClient
      );

      if (!result) {
        throw this.errorFactory.createNotFoundError("Tarea no encontrada", {
          attemptedData: { taskId },
        });
      }

      const updatedTask = await this.taskDAO.findWithTagsByIdAndUserId(
        taskId,
        userId,
        dbClient
      );

      return updatedTask;
    }, externalDbClient);
  }

  async getTaskById(taskId, userId, externalDbClient = null) {
    this.validator.validateRequired(["taskId", "userId"], { taskId, userId });

    return this.dbManager.forRead(async (dbClient) => {
      const task = await this.taskDAO.findWithTagsByIdAndUserId(
        taskId,
        userId,
        dbClient
      );

      if (!task) {
        throw this.errorFactory.createNotFoundError("Tarea no encontrada", {
          attemptedData: { taskId, userId },
        });
      }

      return task;
    }, externalDbClient);
  }

  async getTasksByTags(
    userId,
    tagNames,
    options = {},
    externalDbClient = null
  ) {
    return this.dbManager.forRead(async (dbClient) => {
      const allTasks = await this.taskDAO.findAllByUserId(
        {
          userId,
          ...options,
        },
        dbClient
      );

      if (tagNames && tagNames.length > 0) {
        return allTasks.filter((task) =>
          task.taskTags.some((taskTag) => tagNames.includes(taskTag.tag.name))
        );
      }

      return allTasks;
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
