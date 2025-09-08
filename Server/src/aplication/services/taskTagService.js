const BaseDatabaseHandler = require('../../infrastructure/config/BaseDatabaseHandler');

class TaskTagService extends BaseDatabaseHandler {
  constructor({taskTagDAO, connectionDB, NotFoundError, validateRequired}) {
    super(connectionDB);
    this.taskTagDAO = taskTagDAO;
    this.NotFoundError = NotFoundError;
    this.validateRequired = validateRequired;
  }

  async createTaskTag(taskId, tagId, externalConn = null) {
     this.validateRequired(["taskId","tagId"], { taskId, tagId });
      return this.withTransaction(async (connection) => {
      const relationId = await this.taskTagDAO.create(taskId, tagId, connection);
      return relationId;
         },externalConn);
  }

  async deleteAllByTaskId(taskId, externalConn = null) {
      this.validateRequired(["taskId"], { taskId });
       return this.withTransaction(async (connection) => {
      const deleted = await this.taskTagDAO.deleteByTaskId(taskId, connection);
      if (!deleted) {
      throw new this.NotFoundError("Relación task-tag no encontrada", {
        attemptedData: { taskId },
      });
    }
      return deleted;
    }, externalConn);
  }

  async getAllByTaskId(taskId, externalConn=null) {
    this.validateRequired(["taskId"], { taskId });
       return this.withTransaction(async (connection) => {
      const tarea = await this.taskTagDAO.findByTaskId(taskId, connection);
      if (!tarea) {
        throw new this.NotFoundError("Relacion task-tag no encontrada", {
          attemptedData: { taskId },
        });
      }
       return tarea;
    },externalConn);
  }

  async deleteById(taskTagId, externalConn = null) {
    this.validateRequired(["taskTagId"], { taskTagId });
      return this.withTransaction(async (connection) => {
      const result = await this.taskTagDAO.delete(taskTagId, connection);
      if (!result) {
      throw new this.NotFoundError("Relación task-tag no encontrada", {
        attemptedData: { taskTagId },
      });
    }
      return result;
    },externalConn);
  }
}

module.exports = TaskTagService;
