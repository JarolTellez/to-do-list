class UserResponseDTO {
  constructor({
    id,
    username,
    email,
    rol,
    createdAt,
    updatedAt,
    userTagsCount,
    tasksCount,
    userTags,
    tasks,
  }) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.rol = rol;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.userTagsCount = userTagsCount;
    this.tasksCount = tasksCount;
    this.userTags = userTags || [];
    this.tasks = tasks || [];
  }
}


class AuthResponseDTO {
  constructor({ user, accessToken, expiresIn, expiresAt }) {
    this.user = user;
    this.accessToken = accessToken;
    this.expiresIn = expiresIn;
    this.expiresAt = expiresAt;
    this.tokenType = "Bearer";

  }
}

module.exports={
  UserResponseDTO,
  AuthResponseDTO
}
