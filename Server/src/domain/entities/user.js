const UserTag = require("../entities/userTag");
const DomainValidators = require("../utils/domainValidators");
const {
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
} = require("../errors/domainError");
const Task = require("./task");
const domainValidationConfig = require("../config/domainValidationConfig");

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

  #validateEmail(email) {
    return this.#validator.validateEmail(email, "email", {
      max: this.#config.EMAIL.MAX_LENGTH,
      required: true,
      entity: "User",
    });
  }

  #validatePassword(password) {
    return this.#validator.validatePassword(password, "password", {
      min: this.#config.PASSWORD_HASH.MIN_LENGTH,
      max: this.#config.PASSWORD_HASH.MAX_LENGTH,
      required: true,
      entity: "User",
    });
  }

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
  updateusername(newusername) {
    this.#username = this.#validateusername(newusername);
    this.#updateTimestamp();
  }

  updateEmail(newEmail) {
    this.#email = this.#validateEmail(newEmail);
    this.#updateTimestamp();
  }
  #updateTimestamp() {
    this.#updatedAt = new Date();
  }

  changePassword(newPassword) {
    this.#password = this.#validator.validateText(newPassword, "password", {
      min: this.#config.PASSWORD.MIN_LENGTH,
      max: this.#config.PASSWORD.MAX_LENGTH,
      required: true,
      entity: "User",
    });
    this.#updateTimestamp();
  }

  changeRole(newRole) {
    this.#rol = this.#validator.validateEnum(
      newRole,
      "role",
      this.#config.ROLE.ALLOWED_VALUES,
      "User"
    );
    this.#updateTimestamp();
  }

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

  addUserTagById(tagId) {
    const validatedTagId = this.#validator.validateId(tagId, "Tag");
    const userTag = UserTag.create({ userId: this.#id, tagId: validatedTagId });
    this.addUserTag(userTag);
  }

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

  addTasks(tasks) {
    this.#validateTasks(tasks);
    this.#tasks = tasks;
  }

  removeUserTag(userTagId) {
    const validatedId = this.#validator.validateId(userTagId, "UserTag");
    const initialLength = this.#userTags.length;
    this.#userTags = this.#userTags.filter((ut) => ut.id !== validatedId);

    if (this.#userTags.length !== initialLength) {
      this.#updateTimestamp();
    }
  }

  hasTag(tagId) {
    const validatedTagId = this.#validator.validateId(tagId, "Tag");
    return this.#userTags.some((ut) => ut.tagId === validatedTagId);
  }

  
  // Getters
  get id() {
    return this.#id;
  }
  get username() {
    return this.#username;
  }
  get email() {
    return this.#email;
  }
  get password() {
    return this.#password;
  }
  get rol() {
    return this.#rol;
  }
  get createdAt() {
    return this.#createdAt;
  }
  get updatedAt() {
    return this.#updatedAt;
  }
  get userTags() {
    return [...this.#userTags];
  }
  get tasks() {
    return [...this.#tasks];
  }

  isAdmin() {
    return this.#rol === "admin";
  }

  getTags() {
    return this.#userTags
      .map((userTag) => userTag.tag)
      .filter((tag) => tag !== undefined);
  }

  hasAnyTags() {
    return this.#userTags.length > 0;
  }

  
  canAddMoreTags() {
    return this.#userTags.length < domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER;
  }

  getRemainingTagSlots() {
    return domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER - this.#userTags.length;
  }

  toJSON() {
    return {
      id: this.#id,
      username: this.#username,
      email: this.#email,
      rol: this.#rol,
      createdAt: this.#createdAt.toISOString(),
      updatedAt: this.#updatedAt.toISOString(),
      userTagsCount: this.#userTags.length,
      maxTagsAllowed: domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER,
      isAdmin: this.isAdmin(),
      userTags: this.#userTags.map((userTag) =>
        userTag.toJSON ? userTag.toJSON() : userTag
      ),
      tasks: this.#tasks.map((task) => (task.toJSON ? task.toJSON() : task)),
    };
  }

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
