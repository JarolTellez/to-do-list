const BaseDatabaseHandler = require('../../infrastructure/config/BaseDatabaseHandler');

class TaskTagService extends BaseDatabaseHandler {
  constructor({taskTagDAO, connectionDB, NotFoundError}) {
    super(connectionDB);
    this.taskTagDAO = taskTagDAO;
    this.NotFoundError = NotFoundError;
  }

  async createTaskTag(taskId, tagId, externalConn = null) {
     this.validateRequired(["taskId","tagId"], { taskId, tagId });
      return this.withTransaction(async (connection) => {
      const relationId = await this.taskTagDAO.create(taskId, tagId, connection);
      console.log(`Relación agregada: Tarea ${taskId} ↔ Etiqueta ${tagId}`);
        
      return relationId;
         },externalConn);
  }

  async deleteAllByTaskId(taskId, externalConn = null) {
      this.validateRequired(["taskId"], { taskId });
       return this.withTransaction(async (connection) => {
      const deleted = await this.taskTagDAO.deleteByTaskId(taskId, connection);
      console.log(`Relaciones eliminadas para tarea ${taskId}: ${deleted}`);
      return deleted;
    }, externalConn);
  }

  async getAllByTaskId(taskId, externalConn=null) {
    this.validateRequired(["taskId"], { taskId });
       return this.withTransaction(async (connection) => {
      const tarea = await this.taskTagDAO.findByTaskId(taskId, connection);
    
       return tarea;
    },externalConn);
  }

  async deleteById(taskTagId, externalConn = null) {
    this.validateRequired(["taskTagId"], { taskTagId });
      return this.withTransaction(async (connection) => {
      const result = await this.taskTagDAO.delete(taskTagId, connection);
      return result;
    },externalConn);
  }
}

module.exports = TaskTagService;
