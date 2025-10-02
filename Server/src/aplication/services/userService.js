class UserService {
  constructor({
    userDAO,
    taskDAO,
    dbManager,
    bcrypt,
    errorFactory,
    validator,
    userMapper,
    paginationHelper
  }) {
    this.dbManager = dbManager;
    this.userDAO = userDAO;
    this.taskDAO = taskDAO;
    this.bcrypt = bcrypt;
    this.errorFactory = errorFactory;
    this.validator = validator;
    this.userMapper = userMapper;
    this.paginationHelper=paginationHelper;
  }

  async createUser(createUserRequestDTO) {
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

    return this.dbManager.withTransaction(async (tx) => {
      try {
        const [existingByEmail, existingByusername] = await Promise.all([
          this.userDAO.findByEmail(createUserRequestDTO.email, tx),
          this.userDAO.findByUsername(
            createUserRequestDTO.username,
            tx
          ),
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

        const createdUser = await this.userDAO.create(userDomain, tx);

        return this.userMapper.domainToResponse(createdUser);
      } catch (error) {
        throw error;
      }
    });
  }

  async validateCredentials(loginRequestDTO, transactionClient = null) {
    this.validator.validateRequired(
      ["identifier", "password"],
      loginRequestDTO
    );

    const { identifier, password } = loginRequestDTO;
    const isEmail = this.validator.isValidEmail(identifier);

    let user;
    if (isEmail) {
      this.validator.validateEmail("identifier", loginRequestDTO);
      user = await this.userDAO.findByEmail(identifier, transactionClient);
    } else {
      this.validator.validateLength("identifier", loginRequestDTO, {
        min: 3,
        max: 30,
      });
      user = await this.userDAO.findByUsername(identifier, transactionClient);
    }
    if (!user) {
      throw this.errorFactory.createAuthenticationError(
        "Credenciales inválidas"
      );
    }

    const isPasswordValid = await this.bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw this.errorFactory.createAuthenticationError(
        "Credenciales inválidas"
      );
    }

    return user;
  }

  async validateUserExistenceById(userId, transactionClient = null) {
    const user = await this.userDAO.findById(userId, transactionClient);
    if (!user) {
      throw this.errorFactory.createNotFoundError("Usuario no encontrado");
    }
    return user;
  }

  async findByEmail(email, transactionClient = null) {
    return await this.userDAO.findByEmail(email, transactionClient);
  }

  async findById(id, transactionClient = null) {
    return await this.userDAO.findById(id, transactionClient);
  }

  async validateUserExistenceById(userId, transactionClient = null) {
    this.validator.validateRequired(["userId"], { userId });
    return this.dbManager.withTransaction(async (tx) => {
      const user = await this.userDAO.findById(userId, tx);
      if (!user) {
        throw new this.NotFoundError("Usuario no encontrado", {
          attemptedData: { userId },
        });
      }
      return user;
    }, transactionClient);
  }
}

module.exports = UserService;
