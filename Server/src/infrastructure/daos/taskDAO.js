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
              .filter(taskTag => taskTag && taskTag.tagId) 
              .map(taskTag => ({
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

//   return this.dbManager.withTransaction(async (dbClient) => {
//     try {
//       const taskIdNum = this.inputValidator.validateId(taskDomain.id, "task id");

//       await dbClient.taskTag.deleteMany({
//         where: { taskId: taskIdNum },
//       });

//       const updatedTask = await dbClient.task.update({
//         where: { id: taskIdNum },
//         data: {
//           name: taskDomain.name,
//           description: taskDomain.description,
//           scheduledDate: taskDomain.scheduledDate,
//           isCompleted: taskDomain.isCompleted,
//           priority: taskDomain.priority,
//           taskTags: {
//             create: taskDomain.taskTags.map((taskTag) => ({
//               tagId: taskTag.tagId,
//             })),
//           },
//         },
//         include: {
//           taskTags: {
//             include: {
//               tag: true,
//             },
//           },
//         },
//       });

//       return this.taskMapper.dbToDomainWithTags(updatedTask);
//     } catch (error) {
//       if (error.code === "P2025") {
//         return null;
//       }
//       this._handlePrismaError(error, "taskDAO.updateWithTags", {
//         taskId: taskDomain.id,
//       });
//     }
//   }, externalDbClient);
// }

// async updateWithTags(taskDomain, externalDbClient = null) {
//   return this.dbManager.withTransaction(async (dbClient) => {
//     try {
//       const taskIdNum = this.inputValidator.validateId(taskDomain.id, "task id");

//       // Primero eliminar todas las taskTags existentes
//       await dbClient.taskTag.deleteMany({
//         where: { taskId: taskIdNum }
//       });

//       // Luego crear las nuevas
//       const updatedTask = await dbClient.task.update({
//         where: { id: taskIdNum },
//         data: {
//           name: taskDomain.name,
//           description: taskDomain.description,
//           scheduledDate: taskDomain.scheduledDate,
//           isCompleted: taskDomain.isCompleted,
//           priority: taskDomain.priority,
//           taskTags: {
//             create: taskDomain.taskTags.map(taskTag => ({
//               tagId: taskTag.tagId
//             }))
//           },
//         },
//         include: {
//           taskTags: {
//             include: {
//               tag: true,
//             },
//           },
//         },
//       });

//       return this.taskMapper.dbToDomainWithTags(updatedTask);
//     } catch (error) {
//       if (error.code === "P2025") {
//         return null;
//       }
//       this._handlePrismaError(error, "taskDAO.updateWithTags", {
//         taskId: taskDomain.id,
//       });
//     }
//   }, externalDbClient);
// }

// Solo actualiza datos básicos, sin tocar relaciones
async updateBasicInfo(taskDomain, externalDbClient = null) {
  return this.dbManager.withTransaction(async (dbClient) => {
    try {
      const taskIdNum = this.inputValidator.validateId(taskDomain.id, "task id");

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
          tagId: { in: tagIds }
        }
      });
      
      return true;
    } catch (error) {
      this._handlePrismaError(error, "taskDAO.removeTaskTags", {
        taskId,
        tagIds
      });
    }
  }, externalDbClient);
}


async addTaskTags(taskId, tagIds, externalDbClient = null) {
  return this.dbManager.withTransaction(async (dbClient) => {
    try {
      const taskIdNum = this.inputValidator.validateId(taskId, "task id");
      
      await dbClient.taskTag.createMany({
        data: tagIds.map(tagId => ({
          taskId: taskIdNum,
          tagId: tagId
        })),
        skipDuplicates: true 
      });
      
      return true;
    } catch (error) {
      this._handlePrismaError(error, "taskDAO.addTaskTags", {
        taskId,
        tagIds
      });
    }
  }, externalDbClient);
}

  // async updateCompleted(id, isCompleted, userId, externalDbClient = null) {
  //   return this.dbManager.withTransaction(async (dbClient) => {
  //     try {
  //       const taskIdNum = this.inputValidator.validateId(id, "task id");
  //       const userIdNum = this.inputValidator.validateId(userId, "user id");

  //       if (typeof isCompleted !== "boolean") {
  //         throw this.errorFactory.createValidationError(
  //           "isCompleted must be a boolean"
  //         );
  //       }

  //       const updatedTask = await dbClient.task.update({
  //         where: {
  //           id: taskIdNum,
  //           userId: userIdNum,
  //         },
  //         data: { isCompleted },
  //       });

  //       return this.taskMapper.dbToDomain(updatedTask);
  //     } catch (error) {
  //       if (error.code === "P2025") {
  //         return null; 
  //       }
  //       this._handlePrismaError(error, "taskDAO.updateCompleted", {
  //         taskId: id,
  //         userId,
  //         isCompleted,
  //       });
  //     }
  //   }, externalDbClient);
  // }

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
        const mappedTask= task ? this.taskMapper.dbToDomainWithTags(task) : null;
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

  async findAllByUserId({
    userId,
    isCompleted = false,
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

        const tasks = await dbClient.task.findMany({
          where: {
            userId: userIdNum,
            isCompleted: isCompleted,
          },
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
    return this.findAllByUserId({ ...options, isCompleted: false });
  }

  async findAllCompleteByUserId(options = {}) {
    return this.findAllByUserId({ ...options, isCompleted: true });
  }
}

module.exports = TaskDAO;
