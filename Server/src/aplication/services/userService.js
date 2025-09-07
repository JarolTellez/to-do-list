
const BaseDatabaseHandler = require('../../infrastructure/config/BaseDatabaseHandler');

class UserService extends BaseDatabaseHandler {
  constructor({ userDAO, connectionDB, bcrypt, ConflictError, ValidationError }) {
    super(connectionDB);
    this.userDAO = userDAO;
    this.bcrypt = bcrypt;
    this.ConflictError = ConflictError;
    this.ValidationError = ValidationError;
  }

  async createUser(user, externalConn = null) {
    return this.withTransaction(async (connection) => {
      user.validate();
      const encryptedpassword = await this.bcrypt.hash(user.password, 10);
      user.password = encryptedpassword;

      const addedUser = await this.userDAO.create(user, connection);
      return addedUser;
    }, externalConn);
  }

  async validateCredentials(userName, password, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const user = await this.userDAO.findByNameAndPassword(
        userName,
        password,
        connection
      );

      return user;
    }, externalConn);
  }

  async validateUserExistenceById(userId, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const user = await this.userDAO.findById(
        userId,
        connection
      );

      return user;
    }, externalConn);
  }
}

module.exports = UserService;
