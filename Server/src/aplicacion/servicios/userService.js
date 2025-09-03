const BaseDatabaseHandler = require("../../infraestructura/config/BaseDatabaseHandler");

class UserService extends BaseDatabaseHandler {
  constructor(UsuarioDAO, conexionBD, bcrypt) {
    super(conexionBD);
    this.UsuarioDAO = UsuarioDAO;
    this.bcrypt = bcrypt;
  }

  async createUser(user, externalConn = null) {
    return this.withTransaction(async (connection) => {
      // Verificar si el usuario ya existe
      const existingUser = await this.UsuarioDAO.consultarUsuarioPorNombre(
        user.nombreUsuario,
        connection
      );

      if (existingUser) {
        throw new Error("El usuario ya existe");
      }

      const encryptedpassword = await this.bcrypt.hash(user.contrasena, 10);
      user.contrasena = encryptedpassword;

      user.validar();
      const addedUser = await this.UsuarioDAO.agregarUsuario(user, connection);
      return addedUser;
    }, externalConn);
  }

  async validateCredentials(userName, password, externalConn = null) {
    return this.withTransaction(async (connection) => {
      console.log("Verificando credenciales para usuario:", userName);

      const user = await this.UsuarioDAO.consultarUsuarioPorNombreContrasena(
        userName,
        password,
        connection
      );

      if (!user) {
        console.log("Usuario no encontrado:", userName);
        const error = new Error("Credenciales inválidas");
        error.statusCode = 401;
        throw error;
      }

      console.log("Usuario autenticado:", user.idUsuario);
      return user;
    }, externalConn);
  }

  async validateUserExistenceById(userId, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const user = await this.UsuarioDAO.consultarUsuarioPorId(
        userId,
        connection
      );
      if (!user) {
        throw this.crearErrorPersonalizado(
          "Usuario no encontrado",
          404,
          "USER_NOT_FOUND"
        );
      }

      return user;
    }, externalConn);
  }

    //CAMBIAR POR ERRORES PERSONALIZADOS
  crearErrorPersonalizado(mensaje, statusCode, tipo) {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    error.tipo = tipo;
    return error;
  }
}

module.exports = UserService;
