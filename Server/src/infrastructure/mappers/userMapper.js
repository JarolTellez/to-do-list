class UserMapper {
  constructor({
    User,
    UserResponseDTO,
    AuthResponseDTO,
    CreateUserRequestDTO,
    UpdateUserRequestDTO,
    LoginRequestDTO,
    userTagMapper,
    errorFactory,
  }) {
    this.User = User;
    this.UserResponseDTO = UserResponseDTO;
    this.AuthResponseDTO = AuthResponseDTO;
    this.CreateUserRequestDTO = CreateUserRequestDTO;
    this.UpdateUserRequestDTO = UpdateUserRequestDTO;
    this.LoginRequestDTO = LoginRequestDTO;
    this.userTagMapper = userTagMapper;
    this.errorFactory = errorFactory;
  }

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

  domainToAuthResponse({ userDomain, accessToken, expiresIn, expiresAt }) {
    return new this.AuthResponseDTO({
      user: this.domainToResponse(userDomain),
      accessToken,
      expiresIn,
      expiresAt,
      tokenType: "Bearer",
    });
  }

  requestDataToCreateDTO(requestData) {
    return new this.CreateUserRequestDTO({
      username: requestData.username,
      email: requestData.email,
      password: requestData.password,
      rol: requestData.rol || "user",
    });
  }

  requestDataToUpdateDTO(requestData) {
    return new this.UpdateUserRequestDTO({
      id: requestData.userId,
      username: requestData.username,
      email: requestData.email,
      rol: requestData.rol,
    });
  }

  requestDataToLoginDTO(requestData) {
    return new this.LoginRequestDTO({
      identifier: requestData.identifier,
      password: requestData.password,
    });
  }

  createRequestToDomain(createUserRequest) {
    return this.User.create(
      {
        username: createUserRequest.username,
        email: createUserRequest.email,
        password: createUserRequest.password,
        rol: createUserRequest.rol,
      }
    );
  }

  updateRequestToDomain(updateRequestDTO) {
    return this.User.toUpdate(
      {
        id: updateRequestDTO.id,
        username: updateRequestDTO.username,
        email: updateRequestDTO.email,
        rol: updateRequestDTO.rol,
      }
    );
  }

  loginRequestToDomain(loginRequest) {
    return {
      email: loginRequest.email,
      password: loginRequest.password,
    };
  }

  dbToDomain(row) {
    if (!row) return null;

    return new this.User(
      {
        id: row.id,
        username: row.username,
        email: row.email,
        password: row.password,
        rol: row.rol,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        userTags: [],
        tasks: [],
      }
    );
  }

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
