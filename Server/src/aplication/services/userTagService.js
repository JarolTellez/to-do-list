const TransactionsHandler = require("../../infrastructure/config/transactionsHandler");

class UserTagService extends TransactionsHandler {
  constructor({ userTagDAO, connectionDB, errorFactory, validator }) {
    super(connectionDB);
    this.userTagDAO = userTagDAO;
    this.errorFactory = errorFactory;
    this.validator = validator;
  }

  async createUserTag(userTag, externalConn = null) {
    this.validator.validateRequired(["userTag", userTag]);
    return this.withTransaction(async (connection) => {
      const result = await this.userTagDAO.create(userTag, connection);
      return result;
    }, externalConn);
  }

  async getAllTagsByUserId(userId, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const tagsResult = await this.userTagDAO.findAllByUserId(
        userId,
        connection
      );
      return tagsResult;
    }, externalConn);
  }
}

module.exports = UserTagService;
