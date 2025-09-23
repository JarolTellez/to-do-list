class CreateUserRequestDTO {
  constructor({ userName, email, password, rol }) {
    this.userName = userName;
    this.email = email;
    this.password = password;
    this.rol = rol || "user";
  }
}

class UpdateUserRequestDTO {
  constructor({ userName, email, password, rol }) {
    this.userName = userName;
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

