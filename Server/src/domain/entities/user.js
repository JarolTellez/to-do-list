const UserTag = require("../entities/userTag");
const DomainValidators = require("../utils/domainValidators");
const {
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
} = require("../errors/domainError");
const Task = require("./task");
const domainValidationConfig = require("../config/domainValidationConfig");

/**
 * User domain entity representing system users with authentication and profile management
 * @class User
 * @description Manages user properties, validation, role-based access, and tag associations
 */
class User {
  #id;
  #username;
  #email;
  #password;
  #rol;
  #createdAt;
  #updatedAt;
  #userTags;
  #tasks;
  #validator;
  #config;

  /**
   * Creates a new User instance with validated properties
   * @constructor
   * @param {Object} userData - User initialization data
   * @param {string|number} [userData.id=null] - Unique user identifier
   * @param {string} userData.username - User's unique username
   * @param {string} userData.email - User's email address
   * @param {string} userData.password - User's password (hashed)
   * @param {string} [userData.rol="user"] - User role for access control
   * @param {Date} [userData.createdAt=new Date()] - User creation timestamp
   * @param {Date} [userData.updatedAt=new Date()] - User last update timestamp
   * @param {Array} [userData.userTags=[]] - Associated user tags collection
   * @param {Array} [userData.tasks=[]] - Associated tasks collection
   */
  constructor({
    id = null,
    username,
    email,
    password,
    rol = "user",
    createdAt = new Date(),
    updatedAt = new Date(),
    userTags = [],
    tasks = [],
  }) {
    this.#validator = new DomainValidators();
    this.#config = domainValidationConfig.USER;

    this.#id = this.#validator.validateId(id, "User");
    this.#username = this.#validateusername(username);
    this.#email = this.#validateEmail(email);
    this.#password = this.#validatePassword(password);
    this.#rol = this.#validator.validateEnum(
      rol,
      "role",
      this.#config.ROLE.ALLOWED_VALUES,
      "User"
    );
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt");
    this.#updatedAt = this.#validator.validateDate(updatedAt, "updatedAt");
    this.#userTags = this.#validateUserTags(userTags);
    this.#tasks = this.#validateTasks(tasks);
  }

  /**
   * Validates username format, length, and allowed characters
   * @private
   * @param {string} username - Username to validate
   * @returns {string} Validated username
   * @throws {ValidationError} When username format is invalid
   */
  #validateusername(username) {
    const validated = this.#validator.validateText(username, "username", {
      min: this.#config.USERNAME.MIN_LENGTH,
      max: this.#config.USERNAME.MAX_LENGTH,
      required: true,
      entity: "User",
    });

    if (!this.#config.USERNAME.ALLOWED_CHARS.test(validated)) {
      throw new InvalidFormatError(
        "username",
        this.#config.USERNAME.ALLOWED_CHARS_DESCRIPTION,
        { value: validated }
      );
    }

    return validated;
  }

  /**
   * Validates email format and length constraints
   * @private
   * @param {string} email - Email address to validate
   * @returns {string} Validated email address
   * @throws {ValidationError} When email format is invalid
   */
  #validateEmail(email) {
    return this.#validator.validateEmail(email, "email", {
      max: this.#config.EMAIL.MAX_LENGTH,
      required: true,
      entity: "User",
    });
  }

  /**
   * Validates password strength and length constraints
   * @private
   * @param {string} password - Password to validate
   * @returns {string} Validated password
   * @throws {ValidationError} When password doesn't meet requirements
   */
  #validatePassword(password) {
    return this.#validator.validatePassword(password, "password", {
      min: this.#config.PASSWORD_HASH.MIN_LENGTH,
      max: this.#config.PASSWORD_HASH.MAX_LENGTH,
      required: true,
      entity: "User",
    });
  }

  /**
   * Validates user tags collection format and limits
   * @private
   * @param {Array} userTags - User tags collection to validate
   * @returns {Array} Validated user tags collection
   * @throws {ValidationError} When tags exceed limits or have invalid format
   */
  #validateUserTags(userTags) {
    if (!Array.isArray(userTags)) {
      throw new InvalidFormatError("userTags", "array", {
        entity: "User",
        field: "userTags",
        actualType: typeof userTags,
      });
    }

    if (
      userTags.length >
      domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER
    ) {
      throw new ValidationError(
        `No se pueden asignar más de ${domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER} tags por usuario`,
        {
          entity: "User",
          field: "userTags",
          currentCount: userTags.length,
          maxAllowed:
            domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER,
        }
      );
    }

    const invalidTags = userTags.filter((tag) => !(tag instanceof UserTag));
    if (invalidTags.length > 0) {
      throw new ValidationError(
        "Todos los userTags deben ser instancias de UserTag",
        {
          entity: "User",
          field: "userTags",
          invalidTagsCount: invalidTags.length,
        }
      );
    }

    return [...userTags];
  }

  /**
   * Validates tasks collection contains only Task instances
   * @private
   * @param {Array} tasks - Tasks collection to validate
   * @returns {Array} Validated tasks collection
   * @throws {ValidationError} When tasks contain invalid instances
   */
  #validateTasks(tasks) {
    if (!Array.isArray(tasks)) {
      throw new ValidationError("Campo tareas deben ser un arreglo");
    }

    const invalidTasks = tasks.filter((task) => !(task instanceof Task));
    if (invalidTasks.length > 0) {
      throw new ValidationError(
        "Todas las tareas deben ser instancias de Task",
        {
          entity: "User",
          field: "tasks",
          invalidTasksCount: invalidTasks.length,
        }
      );
    }

    return [...tasks];
  }

  // business logic
  /**
   * Updates username with validation
   * @param {string} newusername - New username value
   */
  updateusername(newusername) {
    this.#username = this.#validateusername(newusername);
    this.#updateTimestamp();
  }

  /**
   * Updates email address with validation
   * @param {string} newEmail - New email address
   */
  updateEmail(newEmail) {
    this.#email = this.#validateEmail(newEmail);
    this.#updateTimestamp();
  }
  /**
   * Updates internal timestamp for tracking modifications
   * @private
   */
  #updateTimestamp() {
    this.#updatedAt = new Date();
  }

  /**
   * Changes user password with validation
   * @param {string} newPassword - New password value
   */
  changePassword(newPassword) {
    this.#password = this.#validator.validateText(newPassword, "password", {
      min: this.#config.PASSWORD.MIN_LENGTH,
      max: this.#config.PASSWORD.MAX_LENGTH,
      required: true,
      entity: "User",
    });
    this.#updateTimestamp();
  }

  /**
   * Changes user role with validation
   * @param {string} newRole - New role value
   */
  changeRole(newRole) {
    this.#rol = this.#validator.validateEnum(
      newRole,
      "role",
      this.#config.ROLE.ALLOWED_VALUES,
      "User"
    );
    this.#updateTimestamp();
  }

  /**
   * Adds a UserTag instance to the user
   * @param {UserTag} userTag - UserTag instance to add
   * @throws {ValidationError} When tag limit exceeded or invalid type
   */
  addUserTag(userTag) {
    if (!(userTag instanceof UserTag)) {
      throw new ValidationError(
        "Debe proporcionar una instancia válida de UserTag",
        {
          entity: "User",
          operation: "addUserTag",
          expectedType: "UserTag",
          actualType: userTag ? userTag.constructor.name : typeof userTag,
        }
      );
    }

    if (
      this.#userTags.length >=
      domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER
    ) {
      throw new ValidationError(
        `No se pueden asignar más de ${domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER} tags por usuario`,
        {
          entity: "User",
          operation: "addUserTag",
          currentCount: this.#userTags.length,
          maxAllowed:
            domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER,
        }
      );
    }
    const existingTag = this.#userTags.find((ut) => ut.tagId === userTag.tagId);
    if (!existingTag) {
      this.#userTags.push(userTag);
      this.#updateTimestamp();
    }
  }

  /**
   * Adds a tag to user by tag ID
   * @param {string|number} tagId - Tag identifier to associate
   */
  addUserTagById(tagId) {
    const validatedTagId = this.#validator.validateId(tagId, "Tag");
    const userTag = UserTag.create({ userId: this.#id, tagId: validatedTagId });
    this.addUserTag(userTag);
  }

  /**
   * Adds multiple tags to user by their IDs
   * @param {Array} tagIds - Array of tag identifiers
   * @throws {ValidationError} When total tags would exceed limit
   */
  addUserTagsByIds(tagIds = []) {
    if (!Array.isArray(tagIds)) {
      throw new InvalidFormatError("tagIds", "array", {
        entity: "User",
        field: "tagIds",
        operation: "addUserTagsByIds",
      });
    }
    const totalAfterAdd = this.#userTags.length + tagIds.length;
    if (
      totalAfterAdd >
      domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER
    ) {
      throw new ValidationError(
        `No se pueden asignar más de ${
          domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER
        } tags. Actual: ${this.#userTags.length}, Intentando agregar: ${
          tagIds.length
        }`,
        {
          entity: "User",
          operation: "addUserTagsByIds",
          currentCount: this.#userTags.length,
          tryingToAdd: tagIds.length,
          maxAllowed:
            domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER,
        }
      );
    }
    tagIds.forEach((tagId) => this.addUserTagById(tagId));
  }

  /**
   * Associates tasks collection with user
   * @param {Array} tasks - Tasks collection to associate
   */
  addTasks(tasks) {
    this.#validateTasks(tasks);
    this.#tasks = tasks;
  }

  /**
   * Removes user tag association by ID
   * @param {string|number} userTagId - User tag identifier to remove
   */
  removeUserTag(userTagId) {
    const validatedId = this.#validator.validateId(userTagId, "UserTag");
    const initialLength = this.#userTags.length;
    this.#userTags = this.#userTags.filter((ut) => ut.id !== validatedId);

    if (this.#userTags.length !== initialLength) {
      this.#updateTimestamp();
    }
  }

  /**
   * Checks if user has specific tag
   * @param {string|number} tagId - Tag identifier to check
   * @returns {boolean} True if tag is associated
   */
  hasTag(tagId) {
    const validatedTagId = this.#validator.validateId(tagId, "Tag");
    return this.#userTags.some((ut) => ut.tagId === validatedTagId);
  }

  // Getters
  /**
   * Gets user unique identifier
   * @returns {string|number|null} User ID
   */
  get id() {
    return this.#id;
  }

  /**
   * Gets username
   * @returns {string} Username
   */
  get username() {
    return this.#username;
  }
  /**
   * Gets email address
   * @returns {string} Email address
   */
  get email() {
    return this.#email;
  }
  /**
   * Gets password (hashed)
   * @returns {string} Password hash
   */
  get password() {
    return this.#password;
  }
  /**
   * Gets user role
   * @returns {string} User role
   */
  get rol() {
    return this.#rol;
  }

  /**
   * Gets creation timestamp
   * @returns {Date} Creation date
   */
  get createdAt() {
    return this.#createdAt;
  }
  /**
   * Gets last update timestamp
   * @returns {Date} Update date
   */
  get updatedAt() {
    return this.#updatedAt;
  }
  /**
   * Gets user tags collection (defensive copy)
   * @returns {Array} User tags
   */
  get userTags() {
    return [...this.#userTags];
  }
  /**
   * Gets tasks collection (defensive copy)
   * @returns {Array} Tasks
   */
  get tasks() {
    return [...this.#tasks];
  }

  /**
   * Checks if user has admin role
   * @returns {boolean} True if user is admin
   */
  isAdmin() {
    return this.#rol === "admin";
  }

  /**
   * Gets associated tag objects from user tags
   * @returns {Array} Tag objects collection
   */
  getTags() {
    return this.#userTags
      .map((userTag) => userTag.tag)
      .filter((tag) => tag !== undefined);
  }

  /**
   * Checks if user has any tags assigned
   * @returns {boolean} True if user has any tags
   */
  hasAnyTags() {
    return this.#userTags.length > 0;
  }

  /**
   * Checks if user can accept more tags
   * @returns {boolean} True if more tags can be added
   */
  canAddMoreTags() {
    return (
      this.#userTags.length <
      domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER
    );
  }

  /**
   * Gets number of remaining available tag slots
   * @returns {number} Available tag slots count
   */
  getRemainingTagSlots() {
    return (
      domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER -
      this.#userTags.length
    );
  }

  /**
   * Converts user to plain object for serialization
   * @returns {Object} User data as plain object
   */
  toJSON() {
    return {
      id: this.#id,
      username: this.#username,
      email: this.#email,
      rol: this.#rol,
      createdAt: this.#createdAt.toISOString(),
      updatedAt: this.#updatedAt.toISOString(),
      userTagsCount: this.#userTags.length,
      maxTagsAllowed:
        domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER,
      isAdmin: this.isAdmin(),
      userTags: this.#userTags.map((userTag) =>
        userTag.toJSON ? userTag.toJSON() : userTag
      ),
      tasks: this.#tasks.map((task) => (task.toJSON ? task.toJSON() : task)),
    };
  }

  /**
   * Factory method to create a new user for registration
   * @static
   * @param {Object} userData - User creation data
   * @returns {User} New user instance
   */
  static create({ username, email, password, rol = "user" }) {
    return new User({
      username,
      email,
      password,
      rol,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Factory method to create user for update scenarios
   * @static
   * @param {Object} userData - User update data
   * @returns {User} User instance for updates
   */
  static toUpdate({ id, username, email, rol }) {
    return new User({
      id,
      username,
      email,
      password: "Temporal123",
      rol,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

module.exports = User;
