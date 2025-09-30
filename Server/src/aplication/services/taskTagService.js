const TransactionsHandler = require('../../infrastructure/config/transactionsHandler');

class TaskTagService extends TransactionsHandler {
  constructor({taskTagDAO, connectionDB, errorFactory, validator}) {
    super(connectionDB);
    this.taskTagDAO = taskTagDAO;
    this.errorFactory=errorFactory;
    this.validator=validator;
  }

  async createTaskTag(taskTag, externalConn = null) {
     this.validator.validateRequired(["taskTag"], { taskTag });
      return this.withTransaction(async (connection) => {
      const relationId = await this.taskTagDAO.create(taskTag, connection);
      return relationId;
         },externalConn);
  }

  async deleteAllByTaskId(taskId, externalConn = null) {
      this.validator.validateRequired(["taskId"], { taskId });
       return this.withTransaction(async (connection) => {
      const deleted = await this.taskTagDAO.deleteByTaskId(taskId, connection);
      if (!deleted) {
      throw this.errorFactory.createNotFoundError("Relación task-tag no encontrada", {
        attemptedData: { taskId },
      });
    }
      return deleted;
    }, externalConn);
  }

  async getAllByTaskId(taskId, externalConn=null) {
    this.validator.validateRequired(["taskId"], { taskId });
       return this.withTransaction(async (connection) => {
      const tarea = await this.taskTagDAO.findByTaskId(taskId, connection);
      if (!tarea) {
        throw this.errorFactory.createthis.errorFactory.createNotFoundError("Relacion task-tag no encontrada", {
          attemptedData: { taskId },
        });
      }
       return tarea;
    },externalConn);
  }

  async deleteById(taskTagId, externalConn = null) {
    this.validator.validateRequired(["taskTagId"], { taskTagId });
      return this.withTransaction(async (connection) => {
      const result = await this.taskTagDAO.delete(taskTagId, connection);
      if (!result) {
      throw this.errorFactory.createNotFoundError("Relación task-tag no encontrada", {
        attemptedData: { taskTagId },
      });
    }
      return result;
    },externalConn);
  }
}

module.exports = TaskTagService;
