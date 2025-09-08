
const BaseDatabaseHandler = require('../../infrastructure/config/BaseDatabaseHandler');

class UserService extends BaseDatabaseHandler {
  constructor({ userDAO, connectionDB, bcrypt, ConflictError, ValidationError,NotFoundError, validateRequired }) {
    super(connectionDB);
    this.userDAO = userDAO;
    this.bcrypt = bcrypt;
    this.ConflictError = ConflictError;
    this.ValidationError = ValidationError;
    this.NotFoundError = NotFoundError;
    this.validateRequired=validateRequired;
  }

  async createUser(user, externalConn = null) {
     this.validateRequired(["user"], { user });
    return this.withTransaction(async (connection) => {
      user.validate();
      const encryptedpassword = await this.bcrypt.hash(user.password, 10);
      user.password = encryptedpassword;

      const addedUser = await this.userDAO.create(user, connection);
      if (!addedUser) {
        throw new this.NotFoundError('Usuario no encontrado',{attemptedData:{userId: user.id}});
      }
      return addedUser;
    }, externalConn);
  }

  async validateCredentials(userName, password, externalConn = null) {
     this.validateRequired(["userName","password"], { userName, password });
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
     this.validateRequired(["userId"], { userId });
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
