class CreateUserRequestDTO {
  constructor({ username, email, password, rol }) {
    this.username = username;
    this.email = email;
    this.password = password;
    this.rol = rol || "user";
  }
}

class UpdateUserRequestDTO {
  constructor({ id,username, email, rol }) {
    this.id=id;
    this.username = username;
    this.email = email;
    this.rol = rol;
  }
}

class LoginRequestDTO {
    constructor({ identifier, password }) {
        this.identifier = identifier;
        this.password = password;
    }
}

module.exports={
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
  LoginRequestDTO
}