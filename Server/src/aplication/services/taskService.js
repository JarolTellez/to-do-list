class TaskService {
  constructor({
    taskDAO,
    taskMapper,
    taskTagMapper,
    userTagMapper,
    tagService,
    userService,
    userTagService,
    dbManager,
    errorFactory,
    validator,
    sortValidator,
    appConfig,
    paginationHelper,
    paginationConfig,
    errorMapper,
  }) {
    this.dbManager = dbManager;
    this.taskDAO = taskDAO;
    this.taskTagMapper = taskTagMapper;
    this.taskMapper = taskMapper;
    this.userTagMapper = userTagMapper;
    this.tagService = tagService;
    this.userService = userService;
    this.userTagService = userTagService;
    this.errorFactory = errorFactory;
    this.validator = validator;
    this.sortValidator = sortValidator;
    this.appConfig = appConfig;
    this.paginationHelper = paginationHelper;
    this.paginationConfig = paginationConfig;
    this.errorMapper = errorMapper;
  }

  async createTask(createTaskRequestDTO, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["userId", "name"], createTaskRequestDTO);

      return this.dbManager.withTransaction(async (dbClient) => {
        await this.userService.validateUserExistenceById(
          createTaskRequestDTO.userId,
          dbClient
        );

        const taskDomain =
          this.taskMapper.createRequestDTOToDomain(createTaskRequestDTO);

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

        const newTask = await this.taskDAO.createWithTags(taskDomain, dbClient);
        if (!newTask) {
          throw this.errorFactory.createDatabaseError(
            "Error al crear la tarea en la base de datos",
            {
              userId: createTaskRequestDTO.userId,
              operation: "createTask",
              taskData: {
                title: createTaskRequestDTO.title,
                hasTags: tagIds.length > 0,
              },
            }
          );
        }

        return newTask;
      }, externalDbClient);
    });
  }

  async updateTask(updateTaskRequestDTO, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["id", "userId"], updateTaskRequestDTO);

      return this.dbManager.withTransaction(async (dbClient) => {
        const existingTask = await this.taskDAO.findWithTagsByIdAndUserId(
          updateTaskRequestDTO.id,
          updateTaskRequestDTO.userId,
          dbClient
        );

        if (!existingTask) {
          throw this.errorFactory.createNotFoundError(
            "Tarea no encontrada para actualizar",
            {
              taskId: updateTaskRequestDTO.id,
              userId: updateTaskRequestDTO.userId,
              operation: "updateTask",
            }
          );
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
          throw this.errorFactory.createDatabaseError(
            "Error al actualizar la información básica de la tarea",
            {
              taskId: updateTaskRequestDTO.id,
              userId: updateTaskRequestDTO.userId,
              operation: "updateTask",
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
    });
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
        throw this.errorFactory.createNotFoundError(
          "Tarea no encontrada para eliminar",
          {
            taskId: taskId,
            userId: userId,
            operation: "deleteTask",
          }
        );
      }

      const deletedTask = await this.taskDAO.delete(taskId, userId, dbClient);
      if (!deletedTask) {
        throw this.errorFactory.createDatabaseError(
          "Error al eliminar la tarea de la base de datos",
          {
            taskId: taskId,
            userId: userId,
            operation: "deleteTask",
          }
        );
      }

      return deletedTask;
    }, externalDbClient);
  }

  async completeTask({ taskId, completed, userId }, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      return this.dbManager.withTransaction(async (dbClient) => {
        const task = await this.taskDAO.findWithTagsByIdAndUserId(
          taskId,
          userId,
          dbClient
        );

        if (!task) {
          throw this.errorFactory.createNotFoundError("Tarea no encontrada", {
            taskId: taskId,
            userId: userId,
            operation: "completeTask",
            targetStatus: completed ? "completed" : "pending",
          });
        }

        task.complete(completed);

        const updatedTask = await this.taskDAO.updateBasicInfo(task, dbClient);
        if (!updatedTask) {
          throw this.errorFactory.createDatabaseError(
            "Error al actualizar el estado de la tarea",
            {
              taskId: taskId,
              userId: userId,
              operation: "completeTask",
              targetStatus: completed ? "completed" : "pending",
            }
          );
        }

        return updatedTask;
      }, externalDbClient);
    });
  }

  async getTaskById(taskId, userId, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["taskId", "userId"], { taskId, userId });

      return this.dbManager.forRead(async (dbClient) => {
        const task = await this.taskDAO.findWithTagsByIdAndUserId(
          taskId,
          userId,
          dbClient
        );

        if (!task) {
          throw this.errorFactory.createNotFoundError("Tarea no encontrada", {
            taskId: taskId,
            userId: userId,
            operation: "getTaskById",
          });
        }

        return task;
      }, externalDbClient);
    });
  }

  async getTasksByTags(
    userId,
    tagNames,
    options = {},
    externalDbClient = null
  ) {
    return this.errorMapper.executeWithErrorMapping(async () => {
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
    });
  }

  async getAllTasksByUserId(userId, options = {}, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      return this.dbManager.forRead(async (dbClient) => {
        const {
          page = this.paginationConfig.DEFAULT_PAGE,
          limit = this.paginationConfig.DEFAULT_LIMIT,
          isCompleted,
          scheduledDateBefore,
          scheduledDateAfter,
          sortBy,
          sortOrder,
        } = options;

        const validatedSort = this.sortValidator.validateAndNormalizeSortParams(
          "TASK",
          { sortBy, sortOrder }
        );
        const pagination = this.paginationHelper.calculatePagination(
          page,
          limit,
          this.paginationConfig.ENTITY_LIMITS.TASKS,
          this.paginationConfig.DEFAULT_PAGE,
          this.paginationConfig.DEFAULT_LIMIT
        );

        const tasks = await this.taskDAO.findAllWithTagsByUserId({
          userId,
          isCompleted,
          scheduledDateBefore,
          scheduledDateAfter,
          sortBy: validatedSort.sortBy,
          sortOrder: validatedSort.sortOrder,
          limit: pagination.limit,
          offset: pagination.offset,
          externalDbClient: dbClient,
        });

        const totalCount = await this.taskDAO.countByUserId(
          {
            userId,
            isCompleted,
            scheduledDateBefore,
            scheduledDateAfter,
          },
          dbClient
        );

        const completedCount = await this.taskDAO.countByUserId(
          { userId, isCompleted: true },
          dbClient
        );

        const pendingCount = await this.taskDAO.countByUserId(
          { userId, isCompleted: false },
          dbClient
        );

        const overdueCount = await this.taskDAO.countOverdueByUserId(
          userId,
          dbClient
        );

        const totalPages = this.paginationHelper.calculateTotalPages(
          totalCount,
          pagination.limit
        );

        return this.paginationHelper.buildPaginationResponse(
          tasks,
          pagination,
          totalCount,
          {
            completed: completedCount,
            pending: pendingCount,
            overdue: overdueCount,
          },
          totalPages,
          "tasks"
        );
      }, externalDbClient);
    });
  }
}

module.exports = TaskService;
