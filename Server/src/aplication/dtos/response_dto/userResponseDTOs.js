class UserResponseDTO {
  constructor({ id, userName, email, rol, createdAt, updatedAt, userTags, tasks }) {
    this.id = id;
    this.userName = userName;
    this.email = email;
    this.rol = rol;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.userTags = userTags || [];
    this.tasks = tasks || [];
  }
}

class UserDetailResponseDTO {
    constructor({ user, userTags = [], tasks = [] }) {
        this.user = user;
        this.userTags = userTags;
        this.tasks = tasks;
        this.userTagsCount = userTags.length;
        this.tasksCount = tasks.length;
    }
}

class AuthResponseDTO {
    constructor({ user, token, expiresIn }) {
        this.user = user;
        this.token = token;
        this.expiresIn = expiresIn;
        this.tokenType = "Bearer";
    }
}