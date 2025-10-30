/**
 * Mapper for User entity transformations between layers
 * @class UserMapper
 */
class UserMapper {
  /**
   * Creates a new UserMapper instance
   * @param {Object} dependencies - Dependencies for UserMapper
   * @param {class} dependencies.User - User domain class
   * @param {class} dependencies.UserResponseDTO - User response DTO class
   * @param {class} dependencies.AuthResponseDTO - Auth response DTO class
   * @param {class} dependencies.CreateUserRequestDTO - Create user request DTO class
   * @param {class} dependencies.UpdateUserRequestDTO - Update user request DTO class
   * @param {class} dependencies.LoginRequestDTO - Login request DTO class
   * @param {Object} dependencies.userTagMapper - UserTag mapper instance
   * @param {Object} dependencies.errorFactory - Error factory instance
   */
  constructor({
    User,
    UserResponseDTO,
    CreateUserRequestDTO,
    UpdateUserRequestDTO,
    LoginRequestDTO,
    userTagMapper,
    errorFactory,
  }) {
    this.User = User;
    this.UserResponseDTO = UserResponseDTO;
    this.CreateUserRequestDTO = CreateUserRequestDTO;
    this.UpdateUserRequestDTO = UpdateUserRequestDTO;
    this.LoginRequestDTO = LoginRequestDTO;
    this.userTagMapper = userTagMapper;
    this.errorFactory = errorFactory;
  }

  /**
   * Converts User domain entity to response DTO
   * @param {User} userDomain - User domain entity
   * @returns {UserResponseDTO} User response DTO
   */
  domainToResponse(userDomain) {
    return new this.UserResponseDTO({
      id: userDomain.id,
      username: userDomain.username,
      email: userDomain.email,
      rol: userDomain.rol,
      createdAt: userDomain.createdAt,
      updatedAt: userDomain.updatedAt,
      userTagsCount: userDomain.userTags ? userDomain.userTags.length : 0,
      tasksCount: userDomain.tasks ? userDomain.tasks.length : 0,
      userTags: userDomain.userTags,
      tasks: userDomain.tasks,
    });
  }

  /**
   * Converts User domain entity to authentication response DTO
   * @param {Object} params - Parameters object
   * @param {User} params.userDomain - User domain entity
   * @param {string} params.accessToken - Access token
   * @param {string} params.expiresIn - Token expiration time
   * @param {Date} params.expiresAt - Token expiration date
   */
  // domainToAuthResponse({ userDomain, accessToken, expiresIn, expiresAt }) {
  //   return new this.AuthResponseDTO({
  //     user: this.domainToResponse(userDomain),
  //     accessToken,
  //     expiresIn,
  //     expiresAt,
  //     tokenType: "Bearer",
  //   });
  // }

  /**
   * Converts request data to create user DTO
   * @param {Object} requestData - Raw request data
   * @returns {CreateUserRequestDTO} Create user request DTO
   */
  requestDataToCreateDTO(requestData) {
    return new this.CreateUserRequestDTO({
      username: requestData.username,
      email: requestData.email,
      password: requestData.password,
      rol: requestData.rol || "user",
    });
  }

  /**
   * Converts request data to update user DTO
   * @param {Object} requestData - Raw request data
   * @returns {UpdateUserRequestDTO} Update user request DTO
   */
  requestDataToUpdateDTO(requestData) {
    return new this.UpdateUserRequestDTO({
      id: requestData.userId,
      username: requestData.username,
      email: requestData.email,
      rol: requestData.rol,
    });
  }

  /**
   * Converts request data to login DTO
   * @param {Object} requestData - Raw request data
   * @returns {LoginRequestDTO} Login request DTO
   */
  requestDataToLoginDTO(requestData) {
    return new this.LoginRequestDTO({
      identifier: requestData.identifier,
      password: requestData.password,
    });
  }

  /**
   * Converts create user request DTO to User domain entity
   * @param {CreateUserRequestDTO} createUserRequest - Create user request DTO
   * @returns {User} User domain entity
   */
  createRequestToDomain(createUserRequest) {
    return this.User.create({
      username: createUserRequest.username,
      email: createUserRequest.email,
      password: createUserRequest.password,
      rol: createUserRequest.rol,
    });
  }

  /**
   * Converts update user request DTO to User domain entity
   * @param {UpdateUserRequestDTO} updateRequestDTO - Update user request DTO
   * @returns {User} User domain entity
   */
  updateRequestToDomain(updateRequestDTO) {
    return this.User.toUpdate({
      id: updateRequestDTO.id,
      username: updateRequestDTO.username,
      email: updateRequestDTO.email,
      rol: updateRequestDTO.rol,
    });
  }

  /**
   * Converts login request DTO to domain format
   * @param {LoginRequestDTO} loginRequest - Login request DTO
   * @returns {Object} Login credentials object
   */
  loginRequestToDomain(loginRequest) {
    return {
      email: loginRequest.email,
      password: loginRequest.password,
    };
  }

  /**
   * Converts database row to User domain entity
   * @param {Object} row - Database row
   * @returns {User|null} User domain entity or null
   */
  dbToDomain(row) {
    if (!row) return null;

    return new this.User({
      id: row.id,
      username: row.username,
      email: row.email,
      password: row.password,
      rol: row.rol,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      userTags: [],
      tasks: [],
    });
  }

  /**
   * Converts database row with tags to User domain entity
   * @param {Object} dbUser - Database user with tags
   * @returns {User|null} User domain entity with tags or null
   */
  dbToDomainWithTags(dbUser) {
    if (!dbUser) return null;

    try {
      const user = this.dbToDomain(dbUser);

      if (dbUser.userTags && Array.isArray(dbUser.userTags)) {
        dbUser.userTags
          .filter((userTag) => userTag && userTag.id)
          .map((userTag) => this.userTagMapper.dbToDomain(userTag))
          .forEach((userTag) => {
            user.addUserTag(userTag);
          });
      }

      return user;
    } catch (error) {
      console.error("Error in dbToDomainWithTags:", error);
      throw error;
    }
  }
}

module.exports = UserMapper;
