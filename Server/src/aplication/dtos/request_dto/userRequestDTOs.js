class CreateUserRequestDTO {
  constructor({ username, email, password, rol }) {
    this.username = username;
    this.email = email;
    this.password = password;
    this.rol = rol || "user";
  }
}

class UpdateUserRequestDTO {
  constructor({ username, email, password, rol }) {
    this.username = username;
    this.email = email;
    this.password = password;
    this.rol = rol;
  }
}

class LoginRequestDTO {
    constructor({ email, password }) {
        this.email = email;
        this.password = password;
    }
}

module.exports={
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
  LoginRequestDTO
}