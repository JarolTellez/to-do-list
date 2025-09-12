const BaseDatabaseHandler = require("../../infrastructure/config/BaseDatabaseHandler");

class UserTagService extends BaseDatabaseHandler{
    constructor({userTagDAO, connectionBD, NotFoundError, validateRequired}){
        super(connectionBD);
        this.userTagDAO=userTagDAO;
        this.NotFoundError=NotFoundError;
        this,validateRequired=validateRequired;
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