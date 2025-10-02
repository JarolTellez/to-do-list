class UserService {
  constructor({
    userDAO,
    taskDAO,
    dbManager,
    bcrypt,
    errorFactory,
    validator,
    userMapper,
    paginationHelper,
  }) {
    this.dbManager = dbManager;
    this.userDAO = userDAO;
    this.taskDAO = taskDAO;
    this.bcrypt = bcrypt;
    this.errorFactory = errorFactory;
    this.validator = validator;
    this.userMapper = userMapper;
    this.paginationHelper = paginationHelper;
  }

  async createUser(createUserRequestDTO, externalDbClient = null) {
    this.validator.validateRequired(
      ["username", "email", "password"],
      createUserRequestDTO
    );
    this.validator.validateEmail("email", createUserRequestDTO);
    this.validator.validateLength("username", createUserRequestDTO, {
      min: 3,
      max: 30,
    });
    this.validator.validateLength("password", createUserRequestDTO, {
      min: 6,
      max: 128,
    });

    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const [existingByEmail, existingByusername] = await Promise.all([
          this.userDAO.findByEmail(createUserRequestDTO.email, dbClient),
          this.userDAO.findByUsername(createUserRequestDTO.username, dbClient),
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

        const hashedPassword = await this.bcrypt.hash(
          createUserRequestDTO.password,
          10
        );

        const userDomain = this.userMapper.createRequestToDomain({
          ...createUserRequestDTO,
          password: hashedPassword,
        });

        const createdUser = await this.userDAO.create(userDomain, dbClient);

        return this.userMapper.domainToResponse(createdUser);
      } catch (error) {
        throw error;
      }
    }, externalDbClient);
  }

  async validateCredentials(loginRequestDTO, externalDbClient = null) {
    this.validator.validateRequired(
      ["identifier", "password"],
      loginRequestDTO
    );

    const { identifier, password } = loginRequestDTO;
    const isEmail = this.validator.isValidEmail(identifier);

    let user;
    return this.dbManager.forRead(async (dbClient) => {
      if (isEmail) {
        this.validator.validateEmail("identifier", loginRequestDTO);
        user = await this.userDAO.findByEmail(identifier, dbClient);
      } else {
        this.validator.validateLength("identifier", loginRequestDTO, {
          min: 3,
          max: 30,
        });
        user = await this.userDAO.findByUsername(identifier, dbClient);
      }
      if (!user) {
        throw this.errorFactory.createAuthenticationError(
          "Credenciales inválidas"
        );
      }

      const isPasswordValid = await this.bcrypt.compare(
        password,
        user.password
      );
      if (!isPasswordValid) {
        throw this.errorFactory.createAuthenticationError(
          "Credenciales inválidas"
        );
      }

      return user;
    }, externalDbClient);
  }

  async getByEmail(email, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      return await this.userDAO.getByEmail(email, dbClient);
    }, externalDbClient);
  }

  async getById(id, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      return await this.userDAO.findById(id, dbClient);
    }, externalDbClient);
  }

  async validateUserExistenceById(userId, externalDbClient = null) {
    this.validator.validateRequired(["userId"], { userId });
    return this.dbManager.forRead(async (dbClient) => {
      const user = await this.userDAO.findById(userId, dbClient);
      if (!user) {
        throw new this.errorFactory.createNotFoundError(
          "Usuario no encontrado",
          {
            attemptedData: { userId },
          }
        );
      }
      return user;
    }, externalDbClient);
  }
}

module.exports = UserService;
