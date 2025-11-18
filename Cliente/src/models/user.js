/**
 * User domain model
 * @class User
 * @description Represents an application user with profile and statistics
 */
export class User {
  /**
   * Creates a new User instance
   * @constructor
   * @param {string} id - User identifier
   * @param {string} username - Username
   * @param {string} email - Email address
   * @param {string} rol - User role
   * @param {string} createdAt - Creation timestamp
   * @param {string} updatedAt - Last update timestamp
   * @param {number} userTagsCount - Number of user tags
   * @param {number} tasksCount - Number of tasks
   * @param {Array} userTags - User tags array
   * @param {Array} tasks - User tasks array
   */
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
  /**
   * Validates user data
   * @function validate
   * @throws {Array} Array of validation errors
   */
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

  /**
   * Validates user data for registration
   * @function validateForRegistration
   * @throws {Array} Array of validation errors
   */
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

  /**
   * Validates user data for update
   * @function validateForUpdate
   * @throws {Array} Array of validation errors
   */
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

  /**
   * Gets display name for user
   * @function getDisplayName
   * @returns {string} Display name
   */
  getDisplayName() {
    return this.username || this.email.split("@")[0];
  }

  /**
   * Checks if user has tags
   * @function hasTags
   * @returns {boolean} Whether user has tags
   */
  hasTags() {
    return this.userTagsCount > 0 || this.userTags.length > 0;
  }

  /**
   * Checks if user has tasks
   * @function hasTasks
   * @returns {boolean} Whether user has tasks
   */
  hasTasks() {
    return this.tasksCount > 0 || this.tasks.length > 0;
  }

  /**
   * Checks if user is admin
   * @function isAdmin
   * @returns {boolean} Whether user has admin role
   */
  isAdmin() {
    return this.rol === "admin";
  }
}
