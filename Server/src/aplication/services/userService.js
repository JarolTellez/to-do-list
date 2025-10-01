class UserService {
  constructor({
    userDAO,
    taskDAO,
    connectionDb,
    bcrypt,
    errorFactory,
    validator,
    userMapper,
  }) {
    this.connectionDb = connectionDb;
    this.userDAO = userDAO;
    this.taskDAO = taskDAO;
    this.bcrypt = bcrypt;
    this.errorFactory = errorFactory;
    this.validator = validator;
    this.userMapper = userMapper;
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

    return this.connectionDb.executeTransaction(async (connection) => {
      try {
        const [existingByEmail, existingByusername] = await Promise.all([
          this.userDAO.findByEmail(createUserRequestDTO.email, connection),
          this.userDAO.findByUsername(
            createUserRequestDTO.username,
            connection
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

        const createdUser = await this.userDAO.create(userDomain, connection);

        return this.userMapper.domainToResponse(createdUser);
      } catch (error) {
        throw error;
      }
    });
  }

  async validateCredentials(loginRequestDTO, externalConn = null) {
    console.log("DTO: ",loginRequestDTO);
    this.validator.validateRequired(
      ["identifier", "password"],
      loginRequestDTO
    );

    const { identifier, password } = loginRequestDTO;
    const isEmail = this.validator.isValidEmail(identifier);

    let user;
    if (isEmail) {
      this.validator.validateEmail("identifier", loginRequestDTO);
      user = await this.userDAO.findByEmail(identifier, externalConn);
    } else {
      this.validator.validateLength("identifier", loginRequestDTO, {
        min: 3,
        max: 30,
      });
      user = await this.userDAO.findByUsername(identifier, externalConn);
    }
console.log("USER EN USERSERVICE: ", user.toJSON());
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

  async validateUserExistenceById(userId, externalConn = null) {
    const user = await this.userDAO.findById(userId, externalConn);
    if (!user) {
      throw this.errorFactory.createNotFoundError("Usuario no encontrado");
    }
    return user;
  }

  async findByEmail(email, externalConn = null) {
    return await this.userDAO.findByEmail(email, externalConn);
  }

  async findById(id, externalConn = null) {
    return await this.userDAO.findById(id, externalConn);
  }

  async validateUserExistenceById(userId, externalConn = null) {
    this.validator.validateRequired(["userId"], { userId });
    return this.connectionDb.executeTransaction(async (connection) => {
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
