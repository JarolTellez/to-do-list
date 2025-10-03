const UserTag = require("../entities/userTag");
const DomainValidators = require("../utils/domainValidators");

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

  constructor(
    {
      id = null,
      username,
      email,
      password,
      rol = "user",
      createdAt = new Date(),
      updatedAt = new Date(),
      userTags = [],
      tasks = [],
    },
    errorFactory
  ) {
    this.#validator = new DomainValidators(errorFactory);

    this.#validateRequiredFields({ username, email, password });

    this.#id = this.#validator.validateId(id, "User");
    this.#username = this.#validateusername(username);
    this.#email = this.#validateEmail(email);
    this.#password = this.#validator.validateText(password, "password", {
      min: 6,
      required: true,
      entity: "User",
    });
    this.#rol = this.#validator.validateEnum(
      rol,
      "role",
      ["user", "admin"],
      "User"
    );
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt");
    this.#updatedAt = this.#validator.validateDate(updatedAt, "updatedAt");
    this.#userTags = this.#validateUserTags(userTags);
    this.#tasks = this.#validateTasks(tasks);
  }

  #validateRequiredFields({ username, email, password }) {
    const missingFields = [];

    if (!username || username.trim().length === 0) {
      missingFields.push("username");
    }

    if (!email || email.trim().length === 0) {
      missingFields.push("email");
    }

    if (!password || password.trim().length === 0) {
      missingFields.push("password");
    }

    if (missingFields.length > 0) {
      throw this.#validator.error.createValidationError(
        `Missing required fields: ${missingFields.join(", ")}`,
        { missingFields },
        this.#validator.codes.REQUIRED_FIELD
      );
    }
  }

  #validateusername(username) {
    const validated = this.#validator.validateText(username, "username", {
      min: 3,
      max: 30,
      required: true,
      entity: "User",
    });

    const invalidChars = /[^a-zA-Z0-9_\-.]/;
    if (invalidChars.test(validated)) {
      throw this.#validator.error.createValidationError(
        "username can only contain letters, numbers, underscores, hyphens and dots",
        null,
        this.#validator.codes.INVALID_FORMAT
      );
    }

    return validated;
  }

  #validateEmail(email) {
    const validated = this.#validator.validateText(email, "email", {
      required: true,
      entity: "User",
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(validated)) {
      throw this.#validator.error.createValidationError(
        "Invalid email format",
        { email: validated },
        this.#validator.codes.INVALID_EMAIL
      );
    }

    return validated;
  }

  #validateUserTags(userTags) {
    if (!Array.isArray(userTags)) {
      throw this.#validator.error.createValidationError(
        "userTags must be an array",
        { actualType: typeof userTags },
        this.#validator.codes.INVALID_FORMAT
      );
    }

    const invalidTags = userTags.filter((tag) => !(tag instanceof UserTag));
    if (invalidTags.length > 0) {
      throw this.#validator.error.createValidationError(
        "All userTags must be instances of UserTag",
        { invalidTagsCount: invalidTags.length },
        this.#validator.codes.INVALID_FORMAT
      );
    }

    return [...userTags];
  }

  #validateTasks(tasks) {
    if (!Array.isArray(tasks)) {
      throw this.#validator.error.createValidationError(
        "tasks must be an array",
        { actualType: typeof tasks },
        this.#validator.codes.INVALID_FORMAT
      );
    }

    const invalidTasks = tasks.filter((task) => !(task instanceof Task));
    if (invalidTasks.length > 0) {
      throw this.#validator.error.createValidationError(
        "All tasks must be instances of Task",
        { invalidTagsCount: invalidTasks.length },
        this.#validator.codes.INVALID_FORMAT
      );
    }

    return [...tasks];
  }

  // business logic
  updateusername(newusername) {
    this.#username = this.#validateusername(newusername);
    this.#updatedAt = new Date();
  }

  updateEmail(newEmail) {
    this.#email = this.#validateEmail(newEmail);
    this.#updatedAt = new Date();
  }

  changePassword(newPassword) {
    this.#password = this.#validator.validateText(newPassword, "password", {
      min: 6,
      required: true,
      entity: "User",
    });
    this.#updatedAt = new Date();
  }

  changeRole(newRole) {
    this.#rol = this.#validator.validateEnum(
      newRole,
      "role",
      ["user", "admin"],
      "User"
    );
    this.#updatedAt = new Date();
  }

  addUserTag(userTag) {
    if (!(userTag instanceof UserTag)) {
      throw this.#validator.error.createValidationError(
        "Must provide an instance of UserTag",
        null,
        this.#validator.codes.INVALID_FORMAT
      );
    }

    if (!this.#userTags.some((ut) => ut.id === userTag.id)) {
      this.#userTags.push(userTag);
      this.#updatedAt = new Date();
    }
  }

  addUserTagById(tagId) {
    const userTag = UserTag.create(
      { userId: this.#id, tagId },
      this.#validator.error
    );
    this.addUserTag(userTag);
  }

  addUserTagsByIds(tagIds = []) {
    tagIds.forEach((tagId) => this.addUserTagById(tagId));
  }

  addTasks(tasks) {
    this.#validateTasks(tasks);
    this.#tasks = tasks;
  }

  removeUserTag(userTagId) {
    const initialLength = this.#userTags.length;
    this.#userTags = this.#userTags.filter((ut) => ut.id !== userTagId);

    if (this.#userTags.length !== initialLength) {
      this.#updatedAt = new Date();
    }
  }

  hasTag(tagId) {
    return this.#userTags.some((ut) => ut.tagId === tagId);
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

  toJSON() {
    return {
      id: this.#id,
      username: this.#username,
      email: this.#email,
      rol: this.#rol,
      createdAt: this.#createdAt.toISOString(),
      updatedAt: this.#updatedAt.toISOString(),
      userTagsCount: this.#userTags.length,
      isAdmin: this.isAdmin(),
      userTags: this.#userTags.map((userTag) =>
        userTag.toJSON ? userTag.toJSON() : userTag
      ),
      tasks: this.#tasks.map((task) => (task.toJSON ? task.toJSON() : task)),
    };
  }

  static create({ username, email, password, rol = "user" }, errorFactory) {
    return new User(
      {
        username,
        email,
        password,
        rol,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      errorFactory
    );
  }
}

module.exports = User;
