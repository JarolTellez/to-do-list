class CreateUserRequestDTO {
  constructor({ userName, email, password, rol, userTags }) {
    this.userName = userName;
    this.email = email;
    this.password = password;
    this.rol = rol || "user";
    this.userTags = userTags || [];
  }
}

class UpdateUserRequestDTO {
  constructor({ userName, email, password, rol, userTags }) {
    this.userName = userName;
    this.email = email;
    this.password = password;
    this.rol = rol;
    this.userTags = userTags || [];
  }
}

class LoginRequestDTO {
    constructor({ email, password }) {
        this.email = email;
        this.password = password;
    }
}

