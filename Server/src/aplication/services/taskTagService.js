const TransactionsHandler = require("../../infrastructure/config/transactionsHandler");

class TaskTagService extends TransactionsHandler {
  constructor({
    taskTagDAO,
    tagService,
    userTagMapper,
    connectionDb,
    errorFactory,
    validator,
  }) {
    super(connectionDb);
    this.taskTagDAO = taskTagDAO;
    this.tagService=tagService;
    this.userTagMapper=userTagMapper;
    this.errorFactory = errorFactory;
    this.validator = validator;
  }

  async createTaskTag(taskTag, externalConn = null) {
    this.validator.validateRequired(["taskTag"], { taskTag });
    return this.withTransaction(async (connection) => {
      const result = await this.taskTagDAO.create(taskTag, connection);
      return result;
    }, externalConn);
  }

  async deleteAllByTaskId(taskId, externalConn = null) {
    this.validator.validateRequired(["taskId"], { taskId });
    return this.withTransaction(async (connection) => {
      const deleted = await this.taskTagDAO.deleteByTaskId(taskId, connection);
      if (!deleted) {
        throw this.errorFactory.createNotFoundError(
          "Relación task-tag no encontrada",
          {
            attemptedData: { taskId },
          }
        );
      }
      return deleted;
    }, externalConn);
  }

  async getAllByTaskId(taskId, externalConn = null) {
    this.validator.validateRequired(["taskId"], { taskId });
    return this.withTransaction(async (connection) => {
      const tarea = await this.taskTagDAO.findByTaskId(taskId, connection);
      if (!tarea) {
        throw this.errorFactory.createthis.errorFactory.createNotFoundError(
          "Relacion task-tag no encontrada",
          {
            attemptedData: { taskId },
          }
        );
      }
      return tarea;
    }, externalConn);
  }

  async deleteById(taskTagId, externalConn = null) {
    this.validator.validateRequired(["taskTagId"], { taskTagId });
    return this.withTransaction(async (connection) => {
      const result = await this.taskTagDAO.delete(taskTagId, connection);
      if (!result) {
        throw this.errorFactory.createNotFoundError(
          "Relación task-tag no encontrada",
          {
            attemptedData: { taskTagId },
          }
        );
      }
      return result;
    }, externalConn);
  }

  async processTaskTagCreation(taskTag, connection) {
    if (!taskTag.tag.id) {
      const createdTag = await this.tagService.createTag(taskTag.tag);
      taskTag.assignTag(createdTag);
    }

    await this.createTaskTag(taskTag, connection);
    const userTag = this.userTagMapper.fromTaskTagAndUserToDomain(
      taskTag,
      taskTag.taskUserId
    );
    await this.userTagService.createUserTag(userTag);
  }
}

module.exports = TaskTagService;
