const UserTag = require("../entities/userTag");
const DomainValidators = require("../utils/domainValidators");

class User {
  #id;
  #userName;
  #email;
  #password;
  #rol;
  #createdAt;
  #updatedAt;
  #userTags;
  #validator;

  constructor({
    id = null,
    userName,
    email,
    password,
    rol = "user",
    createdAt = new Date(),
    updatedAt = new Date(),
    userTags = [],
  }, errorFactory) {
    this.#validator = new DomainValidators(errorFactory);
    
    this.#validateRequiredFields({ userName, email, password });
    
    this.#id = this.#validator.validateId(id, 'User');
    this.#userName = this.#validateUserName(userName);
    this.#email = this.#validateEmail(email);
    this.#password = this.#validator.validateText(password, 'password', { 
      min: 6, 
      required: true, 
      entity: 'User' 
    });
    this.#rol = this.#validator.validateEnum(rol, 'role', ['user', 'admin'], 'User');
    this.#createdAt = this.#validator.validateDate(createdAt, 'createdAt');
    this.#updatedAt = this.#validator.validateDate(updatedAt, 'updatedAt');
    this.#userTags = this.#validateUserTags(userTags);
  }

  #validateRequiredFields({ userName, email, password }) {
    const missingFields = [];
    
    if (!userName || userName.trim().length === 0) {
      missingFields.push('userName');
    }
    
    if (!email || email.trim().length === 0) {
      missingFields.push('email');
    }
    
    if (!password || password.trim().length === 0) {
      missingFields.push('password');
    }
    
    if (missingFields.length > 0) {
      throw this.#validator.error.createValidationError(
        `Missing required fields: ${missingFields.join(', ')}`,
        { missingFields },
        this.#validator.codes.REQUIRED_FIELD
      );
    }
  }

  #validateUserName(userName) {
    const validated = this.#validator.validateText(userName, 'username', { 
      min: 3, 
      max: 30, 
      required: true, 
      entity: 'User' 
    });
    
    const invalidChars = /[^a-zA-Z0-9_\-.]/;
    if (invalidChars.test(validated)) {
      throw this.#validator.error.createValidationError(
        "Username can only contain letters, numbers, underscores, hyphens and dots",
        null,
        this.#validator.codes.INVALID_FORMAT
      );
    }
    
    return validated;
  }

  #validateEmail(email) {
    const validated = this.#validator.validateText(email, 'email', { 
      required: true, 
      entity: 'User' 
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
    
    const invalidTags = userTags.filter(tag => !(tag instanceof UserTag));
    if (invalidTags.length > 0) {
      throw this.#validator.error.createValidationError(
        "All userTags must be instances of UserTag",
        { invalidTagsCount: invalidTags.length },
        this.#validator.codes.INVALID_FORMAT
      );
    }
    
    return [...userTags];
  }

  // business logic
  updateUserName(newUserName) {
    this.#userName = this.#validateUserName(newUserName);
    this.#updatedAt = new Date();
  }

  updateEmail(newEmail) {
    this.#email = this.#validateEmail(newEmail);
    this.#updatedAt = new Date();
  }

  changePassword(newPassword) {
    this.#password = this.#validator.validateText(newPassword, 'password', { 
      min: 6, 
      required: true, 
      entity: 'User' 
    });
    this.#updatedAt = new Date();
  }

  changeRole(newRole) {
    this.#rol = this.#validator.validateEnum(newRole, 'role', ['user', 'admin'], 'User');
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
  get id() { return this.#id; }
  get userName() { return this.#userName; }
  get email() { return this.#email; }
  get password() { return this.#password; }
  get rol() { return this.#rol; }
  get createdAt() { return this.#createdAt; }
  get updatedAt() { return this.#updatedAt; }
  get userTags() { return [...this.#userTags]; }

  isAdmin() { return this.#rol === "admin"; }

  getTags() {
    return this.#userTags
      .map((userTag) => userTag.tag)
      .filter((tag) => tag !== undefined);
  }

  hasAnyTags() { return this.#userTags.length > 0; }

  toJSON() {
    return {
      id: this.#id,
      userName: this.#userName,
      email: this.#email,
      rol: this.#rol,
      createdAt: this.#createdAt,
      updatedAt: this.#updatedAt,
      userTagsCount: this.#userTags.length,
      isAdmin: this.isAdmin(),
      userTags: this.#userTags.map((userTag) =>
        userTag.toJSON ? userTag.toJSON() : userTag
      ),
    };
  }


  static create({ userName, email, password, rol = "user" }, errorFactory) {
    return new User({
      userName,
      email,
      password,
      rol,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, errorFactory);
  }

}

module.exports = User;