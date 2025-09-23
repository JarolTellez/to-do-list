const BaseDatabaseHandler = require("../../infrastructure/config/BaseDatabaseHandler");

class UserService extends BaseDatabaseHandler {
  constructor({
    userDAO,
    taskDAO,
    connectionDB,
    bcrypt,
    errorFactory,
    validator,
    userMapper,
  }) {
    super(connectionDB);
    this.userDAO = userDAO;
    this.taskDAO = taskDAO;
    this.bcrypt = bcrypt;
    this.errorFactory = errorFactory;
    this.validator = validator;
    this.userMapper = userMapper;
  }

  async createUser(user, externalConn = null) {
    this.validator.validateRequired(["userName", "email", "password"], user);
    this.validator.validateEmail("email", user);
    this.validator.validateLength("userName", user, { min: 3, max: 30 });
    this.validator.validateLength("password", user, { min: 6, max: 128 });

    return this.withTransaction(async (connection) => {
      const existingByEmail = await this.userDAO.findByEmail(
        userData.email,
        connection
      );
      if (existingByEmail) {
        throw this.errorFactory.createConflictError(
          "El email ya está registrado"
        );
      }

      const existingByUsername = await this.userDAO.findByUserName(
        userData.userName,
        connection
      );
      if (existingByUsername) {
        throw this.errorFactory.createConflictError(
          "El nombre de usuario ya está en uso"
        );
      }

     
      const hashedPassword = await this.bcrypt.hash(userData.password, 10);

    
      const userDomain = this.userMapper.requestToDomain({
        ...userData,
        password: hashedPassword,
      });

      
      const createdUser = await this.userDAO.create(userDomain, connection);

      return this.userMapper.dominioToRespuestaDTO(createdUser);
    }, externalConn);
  }

  async validateCredentials(userName, password, externalConn = null) {
    this.validator.validateRequired(["userName", "password"], {
      userName,
      password,
    });
    return this.withTransaction(async (connection) => {
      const user = await this.userDAO.findByNameAndPassword(
        userName,
        password,
        connection
      );
      if (!user) {
        throw new this.NotFoundError("Credenciales invalidas", {
          attemptedData: { userName },
        });
      }

      return user;
    }, externalConn);
  }

  async validateUserExistenceById(userId, externalConn = null) {
    this.validator.validateRequired(["userId"], { userId });
    return this.withTransaction(async (connection) => {
      const user = await this.userDAO.findById(userId, connection);
      if (!user) {
        throw new this.NotFoundError("Usuario no encontrado", {
          attemptedData: { userId },
        });
      }
      return user;
    }, externalConn);
  }
}

module.exports = UserService;
