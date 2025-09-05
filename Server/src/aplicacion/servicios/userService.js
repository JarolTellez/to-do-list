const BaseDatabaseHandler = require('../../infraestructura/config/BaseDatabaseHandler');

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
      user.validar();
      const encryptedpassword = await this.bcrypt.hash(user.contrasena, 10);
      user.contrasena = encryptedpassword;

      const addedUser = await this.userDAO.agregarUsuario(user, connection);
      return addedUser;
    }, externalConn);
  }

  async validateCredentials(userName, password, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const user = await this.userDAO.consultarUsuarioPorNombreContrasena(
        userName,
        password,
        connection
      );

      return user;
    }, externalConn);
  }

  async validateUserExistenceById(userId, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const user = await this.userDAO.consultarUsuarioPorId(
        userId,
        connection
      );

      return user;
    }, externalConn);
  }
}

module.exports = UserService;
