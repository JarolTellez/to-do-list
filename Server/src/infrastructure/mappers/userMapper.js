class UserMapper {
  constructor(
    User,
    UserResponseDTO,
    UserDetailResponseDTO,
    AuthResponseDTO,
    userTagMapper,
    errorFactory
  ) {
    this.User = User;
    this.UserResponseDTO = UserResponseDTO;
    this.UserDetailResponseDTO = UserDetailResponseDTO;
    this.AuthResponseDTO = AuthResponseDTO;
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
    });
  }

  domainToDetailResponse(userDomain) {
    return new this.UserDetailResponseDTO({
      user: this.domainToResponse(userDomain),
      userTags: userDomain.userTags || [],
      tasks: userDomain.tasks || [],
    });
  }

  domainToAuthResponse(userDomain, token, expiresIn) {
    return new this.AuthResponseDTO({
      user: this.domainToResponse(userDomain),
      token: token,
      expiresIn: expiresIn,
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
        userTags: existingUser.userTags,
        tasks: existingUser.tasks,
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

  requestToDomain(userRequest) {
    return new this.User(
      {
        id: userRequest.id,
        userName: userRequest.userName,
        email: userRequest.email,
        password: userRequest.password,
        rol: userRequest.rol,
      },
      this.errorFactory
    );
  }

  dbToDomain(row) {
    return new this.User(
      {
        id: row.user_id,
        userName: row.user_name,
        email: row.email,
        password: row.password,
        rol: row.rol,
        createdAt: row.user_created_at,
        userTags: [],
      },
      this.errorFactory
    );
  }

  dbToDomainWithTags(rows) {
     if (!rows || rows.length === 0) return null;

    //unico usuario en todas las rows
    const user = this.dbToDomain(rows[0]);

    // filter evita null si no hay tags
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
