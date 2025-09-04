const BaseDatabaseHandler = require("../../infraestructura/config/BaseDatabaseHandler");

class UserService extends BaseDatabaseHandler {
  constructor({ usuarioDAO, conexionBD, bcrypt, ConflictError, ValidationError }) {
    super(conexionBD);
    this.usuarioDAO = usuarioDAO;
    this.bcrypt = bcrypt;
    this.ConflictError = ConflictError;
    this.ValidationError = ValidationError;
  }

  async createUser(user, externalConn = null) {
    return this.withTransaction(async (connection) => {
      user.validar();
      const encryptedpassword = await this.bcrypt.hash(user.contrasena, 10);
      user.contrasena = encryptedpassword;

      const addedUser = await this.usuarioDAO.agregarUsuario(user, connection);
      return addedUser;
    }, externalConn);
  }

  async validateCredentials(userName, password, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const user = await this.usuarioDAO.consultarUsuarioPorNombreContrasena(
        userName,
        password,
        connection
      );

      return user;
    }, externalConn);
  }

  async validateUserExistenceById(userId, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const user = await this.usuarioDAO.consultarUsuarioPorId(
        userId,
        connection
      );

      return user;
    }, externalConn);
  }
}

module.exports = UserService;
