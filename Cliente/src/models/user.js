export class User {
  constructor(
    id,
    username,
    email,
    rol = "user",
    createdAt,
    updatedAt,
    userTagsCount = 0,
    tasksCount = 0,
    userTags = [],
    tasks = []
  ) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.rol = rol;
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
    this.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
    this.userTagsCount = userTagsCount;
    this.tasksCount = tasksCount;
     this.userTags = userTags;
    this.tasks = tasks;
  }
  validate() {
    const errors = [];

    if (!this.username || this.username.trim() === "") {
      errors.push({
        field: "username",
        message: "El nombre de usuario es obligatorio",
      });
    }

    if (this.username && this.username.length < 3) {
      errors.push({
        field: "username",
        message: "El nombre de usuario debe tener al menos 3 caracteres",
      });
    }

    if (this.username && this.username.length > 50) {
      errors.push({
        field: "username",
        message: "El nombre de usuario no puede superar 50 caracteres",
      });
    }

    if (!this.email || this.email.trim() === "") {
      errors.push({ field: "email", message: "El email es obligatorio" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.email && !emailRegex.test(this.email)) {
      errors.push({
        field: "email",
        message: "El formato del email es inválido",
      });
    }

    const validRoles = ["user", "admin"];
    if (this.rol && !validRoles.includes(this.rol)) {
      errors.push({ field: "rol", message: "El rol debe ser: user o admin" });
    }

    if (errors.length > 0) {
      throw errors;
    }
  }

  validateForRegistration() {
    const errors = [];

    if (!this.username || this.username.trim() === "") {
      errors.push({
        field: "username",
        message: "El nombre de usuario es obligatorio",
      });
    }

    if (this.username && this.username.length < 3) {
      errors.push({
        field: "username",
        message: "El nombre de usuario debe tener al menos 3 caracteres",
      });
    }

    if (!this.email || this.email.trim() === "") {
      errors.push({ field: "email", message: "El email es obligatorio" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.email && !emailRegex.test(this.email)) {
      errors.push({
        field: "email",
        message: "El formato del email es inválido",
      });
    }

    if (!this.password) {
      errors.push({
        field: "password",
        message: "La contraseña es obligatoria",
      });
    }

    if (this.password && this.password.length < 6) {
      errors.push({
        field: "password",
        message: "La contraseña debe tener al menos 6 caracteres",
      });
    }

    if (errors.length > 0) {
      throw errors;
    }
  }

  validateForUpdate() {
    const errors = [];

    if (!this.id) {
      errors.push({
        field: "id",
        message: "El ID es obligatorio para actualizar",
      });
    }

    if (!this.username || this.username.trim() === "") {
      errors.push({
        field: "username",
        message: "El nombre de usuario es obligatorio",
      });
    }

    if (this.username && this.username.length < 3) {
      errors.push({
        field: "username",
        message: "El nombre de usuario debe tener al menos 3 caracteres",
      });
    }

    if (!this.email || this.email.trim() === "") {
      errors.push({ field: "email", message: "El email es obligatorio" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.email && !emailRegex.test(this.email)) {
      errors.push({
        field: "email",
        message: "El formato del email es inválido",
      });
    }

    if (errors.length > 0) {
      throw errors;
    }
  }

  getDisplayName() {
    return this.username || this.email.split("@")[0];
  }

  hasTags() {
    return this.userTagsCount > 0 || this.userTags.length > 0;
  }

  hasTasks() {
    return this.tasksCount > 0 || this.tasks.length > 0;
  }

  isAdmin() {
    return this.rol === "admin";
  }
}
