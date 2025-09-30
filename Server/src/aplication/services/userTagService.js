const TransactionsHandler = require("../../infrastructure/config/transactionsHandler");

class UserTagService extends TransactionsHandler {
  constructor({ userTagDAO, connectionDB, errorFactory, validator }) {
    super(connectionDB);
    this.userTagDAO = userTagDAO;
    this.errorFactory = errorFactory;
    this.validator = validator;
  }

  async createUserTag(userTag, externalConn = null) {
    this.validator.validateRequired(["userId", "tagId"], {
      userId: userTag.userId,
      tagId: userTag.tagId,
    });

    return this.withTransaction(async (connection) => {
      const existing = await this.userTagDAO.findByUserIdAndTagId(
        userTag.userId,
        userTag.tagId,
        connection
      );
      if (existing) {
        return existing;
      }
      const createdUserTag = await this.userTagDAO.create(userTag, connection);
      return createdUserTag;
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
