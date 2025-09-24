class UserMapper {
  constructor({
    User,
    UserResponseDTO,
    AuthResponseDTO,
    CreateUserRequestDTO,
    UpdateUserRequestDTO,
    LoginRequestDTO,
    userTagMapper,
    errorFactory
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
      userName: userDomain.userName,
      email: userDomain.email,
      rol: userDomain.rol,
      createdAt: userDomain.createdAt,
      updatedAt: userDomain.updatedAt,
      userTagsCount: userDomain.userTags ? userDomain.userTags.length : 0,
      tasksCount: userDomain.tasks ? userDomain.tasks.length : 0,
      userTags: userDomain.userTags || [],
      tasks: userDomain.tasks || [],
    });
  }

  domainToAuthResponse(userDomain, token, expiresIn) {
    return new this.AuthResponseDTO({
      user: this.domainToResponse(userDomain),
      token: token,
      expiresIn: expiresIn,
      tokenType: "Bearer",
    });
  }

  requestDataToCreateDTO(requestData) {
    return new this.CreateUserRequestDTO({
      userName: requestData.userName,
      email: requestData.email,
      password: requestData.password,
      rol: requestData.rol || "user",
    });
  }

  requestDataToUpdateDTO(requestData) {
    return new this.UpdateUserRequestDTO({
      userName: requestData.userName,
      email: requestData.email,
      password: requestData.password,
      rol: requestData.rol,
    });
  }

  requestDataToLoginDTO(requestData) {
     return new this.LoginRequestDTO({
      email: requestData.email,
      password: requestData.password,
    });
  }

  createRequestToDomain(createUserRequest) {
    return this.User.create(
      {
        userName: createUserRequest.userName,
        email: createUserRequest.email,
        password: createUserRequest.password,
        rol: createUserRequest.rol,
      },
      this.errorFactory
    );
  }

  updateRequestToDomain(updateUserRequest, existingUser) {
    return new this.User(
      {
        id: existingUser.id,
        userName:
          updateUserRequest.userName !== undefined
            ? updateUserRequest.userName
            : existingUser.userName,
        email:
          updateUserRequest.email !== undefined
            ? updateUserRequest.email
            : existingUser.email,
        password:
          updateUserRequest.password !== undefined
            ? updateUserRequest.password
            : existingUser.password,
        rol:
          updateUserRequest.rol !== undefined
            ? updateUserRequest.rol
            : existingUser.rol,
        createdAt: existingUser.createdAt,
        updatedAt: new Date(),
        userTags: existingUser.userTags || [],
        tasks: existingUser.tasks || [],
      },
      this.errorFactory
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
        id: row.user_id,
        userName: row.user_name,
        email: row.email,
        password: row.password,
        rol: row.rol,
        createdAt: row.user_created_at,
        updatedAt: row.user_updated_at,
        userTags: [],
        tasks: [],
      },
      this.errorFactory
    );
  }

  dbToDomainWithTags(rows) {
    if (!rows || rows.length === 0) return null;

    const user = this.dbToDomain(rows[0]);

    const userTags = rows
      .filter((r) => r.user_tag_id)
      .map((r) => this.userTagMapper.dbToDomain(r));


    userTags.forEach((userTag) => {
      user.addUserTag(userTag);
    });

    return user;
  }

  
}

module.exports = UserMapper;
