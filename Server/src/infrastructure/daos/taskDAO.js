const BaseDatabaseHandler = require("../config/baseDatabaseHandler");
const { TASK_SORT_FIELD } = require("../constants/sortConstants");

class TaskDAO extends BaseDatabaseHandler {
  constructor({ taskMapper, dbManager, errorFactory, inputValidator }) {
    super({ dbManager, inputValidator, errorFactory });
    this.taskMapper = taskMapper;
  }

  async create(task, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const createdTask = await dbClient.task.create({
          data: {
            name: task.name,
            description: task.description,
            scheduledDate: task.scheduledDate,
            isCompleted: task.isCompleted || false,
            priority: task.priority || "medium",
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
        console.error("Error en createWithTags:", error);
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
          return null;
        }
        this._handlePrismaError(error, "taskDAO.updateBasicInfo", {
          taskId: taskDomain.id,
        });
      }
    }, externalDbClient);
  }

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
        this._handlePrismaError(error, "taskDAO.removeTaskTags", {
          taskId,
          tagIds,
        });
      }
    }, externalDbClient);
  }

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
        this._handlePrismaError(error, "taskDAO.addTaskTags", {
          taskId,
          tagIds,
        });
      }
    }, externalDbClient);
  }

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
          return false;
        }
        this._handlePrismaError(error, "taskDAO.delete", {
          taskId: id,
          userId,
        });
      }
    }, externalDbClient);
  }

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
  async findAllPendingByUserId(options = {}) {
    return this.findAllWithTagsByUserId({ ...options, isCompleted: false });
  }

  async findAllCompletedByUserId(options = {}) {
    return this.findAllWithTagsByUserId({ ...options, isCompleted: true });
  }

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
