const BaseDatabaseHandler = require("../config/baseDatabaseHandler");
const { TASK_SORT_FIELD } = require("../constants/sortConstants");

/**
 * Data Access Object for Task entity handling database operations
 * @class TaskDAO
 * @extends BaseDatabaseHandler
 */
class TaskDAO extends BaseDatabaseHandler {
  /**
   * Creates a new TaskDAO instance
   * @param {Object} dependencies - Dependencies for TaskDAO
   * @param {Object} dependencies.taskMapper - Mapper for task data transformation from dbData to domain
   * @param {Object} dependencies.dbManager - Database manager for connection handling (prisma)
   * @param {Object} dependencies.errorFactory - Factory for creating app errors
   * @param {Object} dependencies.inputValidator - Validator for input parameters
   */
  constructor({ taskMapper, dbManager, errorFactory, inputValidator }) {
    super({ dbManager, inputValidator, errorFactory });
    this.taskMapper = taskMapper;
  }

  /**
   * Creates a new task in the database
   * @param {Task} task - Task domain entity to create
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<Task>} Created task domain entity
   * @throws {ValidationError} If task data is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async create(task, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const createdTask = await dbClient.task.create({
          data: {
            name: task.name,
            description: task.description,
            scheduledDate: task.scheduledDate,
            isCompleted: task.isCompleted || false,
            priority: task.priority,
            userId: task.userId,
          },
        });

        return this.taskMapper.dbToDomain(createdTask);
      } catch (error) {
        this._handlePrismaError(error, "taskDAO.create", {
          attemptedData: { name: task.name, userId: task.userId },
        });
      }
    }, externalDbClient);
  }

  /**
   * Creates a new task with associated tags in the database
   * @param {Task} taskDomain - Task domain entity with tags to create
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<Task>} Created task domain entity with tags
   * @throws {ValidationError} If task data is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async createWithTags(taskDomain, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const taskData = {
          name: taskDomain.name,
          description: taskDomain.description,
          scheduledDate: taskDomain.scheduledDate,
          isCompleted: taskDomain.isCompleted || false,
          priority: taskDomain.priority,
          userId: taskDomain.userId,
        };
        const createdTask = await dbClient.task.create({
          data: {
            ...taskData,
            taskTags: {
              create: taskDomain.taskTags
                .filter((taskTag) => taskTag && taskTag.tagId)
                .map((taskTag) => ({
                  tagId: taskTag.tagId,
                })),
            },
          },
          include: {
            taskTags: {
              include: {
                tag: true,
              },
            },
          },
        });

        return this.taskMapper.dbToDomainWithTags(createdTask);
      } catch (error) {
        this._handlePrismaError(error, "taskDAO.createWithTags", {
          attemptedData: {
            name: taskDomain.name,
            userId: taskDomain.userId,
            taskTagsCount: taskDomain.taskTags.length,
          },
        });
      }
    }, externalDbClient);
  }

  /**
   * Updates basic task information (excluding tags)
   * @param {Task} taskDomain - Task domain entity with updated data
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<Task>} Updated task domain entity
   * @throws {ValidationError} If task ID is invalid
   * @throws {NotFoundError} If task is not found
   * @throws {DatabaseError} On database operation failure
   */
  async updateBasicInfo(taskDomain, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const taskIdNum = this.inputValidator.validateId(
          taskDomain.id,
          "task id"
        );

        const updatedTask = await dbClient.task.update({
          where: { id: taskIdNum },
          data: {
            name: taskDomain.name,
            description: taskDomain.description,
            scheduledDate: taskDomain.scheduledDate,
            isCompleted: taskDomain.isCompleted,
            priority: taskDomain.priority,
          },
        });

        return this.taskMapper.dbToDomain(updatedTask);
      } catch (error) {
        if (error.code === "P2025") {
          throw this.errorFactory.createNotFoundError(
            "Tarea no encontrada para actualizar",
            {
              taskId: taskDomain.id,
              prismaCode: error.code,
              operation: "taskDAO.updateBasicInfo",
            }
          );
        }
        this._handlePrismaError(error, "taskDAO.updateBasicInfo", {
          taskId: taskDomain.id,
        });
      }
    }, externalDbClient);
  }

  /**
   * Removes tags from a task
   * @param {number|string} taskId - ID of the task
   * @param {number[]} tagIds - Array of tag IDs to remove
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<boolean>} True if removal was successful
   * @throws {ValidationError} If task ID or tag IDs are invalid
   * @throws {NotFoundError} If task is not found
   * @throws {DatabaseError} On database operation failure
   */
  async removeTaskTags(taskId, tagIds, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const taskIdNum = this.inputValidator.validateId(taskId, "task id");

        await dbClient.taskTag.deleteMany({
          where: {
            taskId: taskIdNum,
            tagId: { in: tagIds },
          },
        });

        return true;
      } catch (error) {
        if (error.code === "P2025") {
          throw this.errorFactory.createNotFoundError(
            "Tarea no encontrada para remover tags",
            {
              taskId,
              prismaCode: error.code,
              operation: "taskDAO.removeTaskTags",
            }
          );
        }
        this._handlePrismaError(error, "taskDAO.removeTaskTags", {
          taskId,
          tagIds,
        });
      }
    }, externalDbClient);
  }

  /**
   * Adds tags to a task
   * @param {number|string} taskId - ID of the task
   * @param {number[]} tagIds - Array of tag IDs to add
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<boolean>} True if addition was successful
   * @throws {ValidationError} If task ID or tag IDs are invalid
   * @throws {NotFoundError} If task is not found
   * @throws {DatabaseError} On database operation failure
   */
  async addTaskTags(taskId, tagIds, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const taskIdNum = this.inputValidator.validateId(taskId, "task id");

        await dbClient.taskTag.createMany({
          data: tagIds.map((tagId) => ({
            taskId: taskIdNum,
            tagId: tagId,
          })),
          skipDuplicates: true,
        });

        return true;
      } catch (error) {
        if (error.code === "P2025") {
          throw this.errorFactory.createNotFoundError(
            "Tarea no encontrada para agregar tags",
            {
              taskId,
              prismaCode: error.code,
              operation: "taskDAO.addTaskTags",
            }
          );
        }
        this._handlePrismaError(error, "taskDAO.addTaskTags", {
          taskId,
          tagIds,
        });
      }
    }, externalDbClient);
  }

  /**
   * Deletes a task from the database
   * @param {number|string} id - ID of the task to delete
   * @param {number|string} userId - ID of the user who owns the task
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<boolean>} True if deletion was successful
   * @throws {ValidationError} If task ID or user ID are invalid
   * @throws {NotFoundError} If task is not found
   * @throws {DatabaseError} On database operation failure
   */
  async delete(id, userId, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const taskIdNum = this.inputValidator.validateId(id, "task id");
        const userIdNum = this.inputValidator.validateId(userId, "user id");

        await dbClient.task.delete({
          where: {
            id: taskIdNum,
            userId: userIdNum,
          },
        });

        return true;
      } catch (error) {
        if (error.code === "P2025") {
          throw this.errorFactory.createNotFoundError(
            "Tarea no encontrada para eliminar",
            {
              taskId: id,
              userId,
              prismaCode: error.code,
              operation: "taskDAO.delete",
            }
          );
        }
        this._handlePrismaError(error, "taskDAO.delete", {
          taskId: id,
          userId,
        });
      }
    }, externalDbClient);
  }

  /**
   * Finds a task by ID
   * @param {number|string} id - ID of the task to find
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<Task|null>} Task domain entity if found, null otherwise
   * @throws {ValidationError} If task ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findById(id, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        const taskIdNum = this.inputValidator.validateId(id, "task id");
        const task = await dbClient.task.findUnique({
          where: { id: taskIdNum },
        });

        return task ? this.taskMapper.dbToDomain(task) : null;
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }
        this._handlePrismaError(error, "taskDAO.findById", { taskId: id });
      }
    }, externalDbClient);
  }

  /**
   * Finds a task by ID and user ID including its tags
   * @param {number|string} id - ID of the task to find
   * @param {number|string} userId - ID of the user who owns the task
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<Task|null>} Task domain entity with tags if found, null otherwise
   * @throws {ValidationError} If task ID or user ID are invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findWithTagsByIdAndUserId(id, userId, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        const taskIdNum = this.inputValidator.validateId(id, "task id");
        const userIdNum = this.inputValidator.validateId(userId, "user id");

        const task = await dbClient.task.findUnique({
          where: {
            id: taskIdNum,
            userId: userIdNum,
          },
          include: {
            taskTags: {
              include: {
                tag: true,
              },
            },
          },
        });
        const mappedTask = task
          ? this.taskMapper.dbToDomainWithTags(task)
          : null;
        return mappedTask;
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }
        this._handlePrismaError(error, "taskDAO.findWithTagsByIdAndUserId", {
          taskId: id,
          userId,
        });
      }
    }, externalDbClient);
  }

  /**
   * Finds all tasks for a user with optional filtering, sorting and pagination
   * @param {Object} options - Query options
   * @param {number|string} options.userId - ID of the user
   * @param {boolean} [options.isCompleted=false] - Filter by completion status
   * @param {Date|string} [options.scheduledDateBefore] - Filter by maximum scheduled date
   * @param {Date|string} [options.scheduledDateAfter] - Filter by minimum scheduled date
   * @param {string} [options.sortBy=TASK_SORT_FIELD.LAST_UPDATE_DATE] - Field to sort by
   * @param {string} [options.sortOrder="desc"] - Sort order (asc/desc)
   * @param {number} [options.limit=null] - Maximum number of tasks to return
   * @param {number} [options.offset=null] - Number of tasks to skip
   * @param {Object} [options.externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<Task[]>} Array of task domain entities with tags
   * @throws {ValidationError} If user ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findAllWithTagsByUserId({
    userId,
    isCompleted = false,
    scheduledDateBefore,
    scheduledDateAfter,
    sortBy = TASK_SORT_FIELD.LAST_UPDATE_DATE,
    sortOrder = "desc",
    limit = null,
    offset = null,
    externalDbClient = null,
  } = {}) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(userId, "user id");

        const sortOptions = this._buildSortOptions(
          sortBy,
          sortOrder,
          TASK_SORT_FIELD
        );
        const paginationOptions = this._buildPaginationOptions(limit, offset);
        const whereConditions = {
          userId: userIdNum,
          isCompleted: isCompleted,
        };

        const dateConditions = {};

        if (scheduledDateBefore) {
          dateConditions.lt = new Date(scheduledDateBefore);
        }

        if (scheduledDateAfter) {
          dateConditions.gt = new Date(scheduledDateAfter);
        }

        if (Object.keys(dateConditions).length > 0) {
          whereConditions.scheduledDate = dateConditions;
        }
        const tasks = await dbClient.task.findMany({
          where: whereConditions,
          include: {
            taskTags: {
              include: {
                tag: true,
              },
            },
          },
          ...sortOptions,
          ...paginationOptions,
        });

        return tasks.map((task) => this.taskMapper.dbToDomainWithTags(task));
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }
        this._handlePrismaError(error, "taskDAO.findAllByUserId", {
          userId,
          isCompleted,
          limit,
          offset,
        });
      }
    }, externalDbClient);
  }

  /**
   * Finds all pending tasks for a user
   * @param {Object} options - Query options (same as findAllWithTagsByUserId)
   * @returns {Promise<Task[]>} Array of pending task domain entities with tags
   */
  async findAllPendingByUserId(options = {}) {
    return this.findAllWithTagsByUserId({ ...options, isCompleted: false });
  }

  /**
   * Finds all completed tasks for a user
   * @param {Object} options - Query options (same as findAllWithTagsByUserId)
   * @returns {Promise<Task[]>} Array of completed task domain entities with tags
   */
  async findAllCompletedByUserId(options = {}) {
    return this.findAllWithTagsByUserId({ ...options, isCompleted: true });
  }

  /**
   * Finds all overdue tasks for a user (pending tasks with scheduled date before now)
   * @param {Object} options - Query options
   * @param {number|string} options.userId - ID of the user
   * @param {string} [options.sortBy=TASK_SORT_FIELD.LAST_UPDATE_DATE] - Field to sort by
   * @param {string} [options.sortOrder="desc"] - Sort order (asc/desc)
   * @param {number} [options.limit=null] - Maximum number of tasks to return
   * @param {number} [options.offset=null] - Number of tasks to skip
   * @param {Object} [options.externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<Task[]>} Array of overdue task domain entities with tags
   */
  async findAllOverdueByUserId({
    userId,
    sortBy = TASK_SORT_FIELD.LAST_UPDATE_DATE,
    sortOrder = "desc",
    limit = null,
    offset = null,
    externalDbClient = null,
  } = {}) {
    return this.findAllWithTagsByUserId({
      userId,
      isCompleted: false,
      scheduledDateBefore: new Date(),
      sortBy,
      sortOrder,
      limit,
      offset,
      externalDbClient,
    });
  }

  /**
   * Counts tasks for a user by completion status
   * @param {Object} options - Count options
   * @param {number|string} options.userId - ID of the user
   * @param {boolean} [options.isCompleted=false] - Filter by completion status
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<number>} Number of tasks matching the criteria
   * @throws {ValidationError} If user ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async countByUserId(
    { userId, isCompleted = false },
    externalDbClient = null
  ) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(userId, "user id");

        const count = await dbClient.task.count({
          where: {
            userId: userIdNum,
            isCompleted: isCompleted,
          },
        });

        return count;
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }
        this._handlePrismaError(error, "taskDAO.countByUserId", {
          userId,
          isCompleted,
        });
      }
    }, externalDbClient);
  }

  /**
   * Counts overdue tasks for a user (pending tasks with scheduled date before now)
   * @param {number|string} userId - ID of the user
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<number>} Number of overdue tasks
   * @throws {ValidationError} If user ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async countOverdueByUserId(userId, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(userId, "user id");
        const now = new Date();

        const count = await dbClient.task.count({
          where: {
            userId: userIdNum,
            isCompleted: false,
            scheduledDate: {
              lt: now,
            },
          },
        });

        return count;
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }
        this._handlePrismaError(error, "taskDAO.countOverdueByUserId", {
          userId,
        });
      }
    }, externalDbClient);
  }
}

module.exports = TaskDAO;
