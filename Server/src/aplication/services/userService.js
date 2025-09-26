const TransactionsHandler = require("../../infrastructure/config/transactionsHandler");
const { CreateTagRequestDTO } = require("../dtos/request_dto/tagRequestDTOs");

class UserService extends TransactionsHandler{
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

  async createUser(createUserRequestDTO, externalConn = null) {
    this.validator.validateRequired(["username", "email", "password"], createUserRequestDTO);
    this.validator.validateEmail("email", createUserRequestDTO);
    this.validator.validateLength("username", createUserRequestDTO, { min: 3, max: 30 });
    this.validator.validateLength("password", createUserRequestDTO, { min: 6, max: 128 });

    return this.withTransaction(async (connection) => {
     const [existingByEmail, existingByusername] = await Promise.all([
      this.userDAO.findByEmail(createUserRequestDTO.email, connection),
      this.userDAO.findByusername(createUserRequestDTO.username, connection)
     ]);
      if (existingByEmail) {
        throw this.errorFactory.createConflictError(
          "El email ya está registrado"
        );
      }
      if (existingByusername) {
        throw this.errorFactory.createConflictError(
          "El nombre de usuario ya está en uso"
        );
      }

     
      const hashedPassword = await this.bcrypt.hash(createUserRequestDTO.password, 10);

    
      const userDomain = this.userMapper.createRequestToDomain({
        ...createUserRequestDTO,
        password: hashedPassword,
      });

      
      const createdUser = await this.userDAO.create(userDomain, connection);

      return this.userMapper.domainToResponse(createdUser);
    }, externalConn);
  }

  async validateCredentials(username, password, externalConn = null) {
    this.validator.validateRequired(["username", "password"], {
      username,
      password,
    });
    return this.withTransaction(async (connection) => {
      const user = await this.userDAO.findByNameAndPassword(
        username,
        password,
        connection
      );
      if (!user) {
        throw new this.NotFoundError("Credenciales invalidas", {
          attemptedData: { username },
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
