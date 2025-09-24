const DomainValidators = require("../utils/domainValidators");
const Tag = require("../entities/tag");
const User = require("../entities/user");

class UserTag {
  #id;
  #userId;
  #tagId;
  #createdAt;
  #tag;
  #user;
  #validator;

  constructor(
    {
      id = null,
      userId,
      tagId,
      createdAt = new Date(),
      tag = null,
      user = null,
    },
    errorFactory
  ) {
    this.#validator = new DomainValidators(errorFactory);

    this.#id = this.#validator.validateId(id, "UserTag");
    this.#userId = this.#validator.validateId(userId, "User");
    this.#tagId = this.#validator.validateId(tagId, "Tag");
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt");
    this.#tag = this.#validateTag(tag);
    this.#user = this.#validateUser(user);

    this.#validateBusinessRules();
  }

  #validateTag(tag) {
    if (tag === null || tag === undefined) return null;

    if (!(tag instanceof Tag)) {
      throw this.#validator.error.createValidationError(
        "Must provide a valid Tag instance",
        null,
        this.#validator.codes.INVALID_FORMAT
      );
    }

    if (this.#tagId && tag.id !== this.#tagId) {
      throw this.#validator.error.createValidationError(
        "Assigned tag does not match tagId",
        { tagId: this.#tagId, tagIdFromObject: tag.id },
        this.#validator.codes.BUSINESS_RULE_VIOLATION
      );
    }

    return tag;
  }

  #validateUser(user) {
    if (user === null || user === undefined) return null;

    if (!(user instanceof User)) {
      throw this.#validator.error.createValidationError(
        "Must provide a valid User instance",
        null,
        this.#validator.codes.INVALID_FORMAT
      );
    }

    if (this.#userId && user.id !== this.#userId) {
      throw this.#validator.error.createValidationError(
        "Assigned user does not match userId",
        { userId: this.#userId, userIdFromObject: user.id },
        this.#validator.codes.BUSINESS_RULE_VIOLATION
      );
    }

    return user;
  }

  #validateBusinessRules() {
    if (!this.#userId || !this.#tagId) {
      throw this.#validator.error.createValidationError(
        "UserId and TagId are required",
        { userId: this.#userId, tagId: this.#tagId },
        this.#validator.codes.REQUIRED_FIELD
      );
    }
  }

  // business logic
  assignTag(tag) {
    this.#tag = this.#validateTag(tag);
    if (tag) {
      this.#tagId = tag.id;
    }
  }

  assignUser(user) {
    this.#user = this.#validateUser(user);
    if (user) {
      this.#userId = user.id;
    }
  }

  updateCreatedAt(createdAt) {
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt");
  }

  updateId(id) {
    this.#id = this.#validator.validateId(id, "UserTag");
  }

  //Getters
  get id() {
    return this.#id;
  }
  get userId() {
    return this.#userId;
  }
  get tagId() {
    return this.#tagId;
  }
  get createdAt() {
    return this.#createdAt;
  }
  get tag() {
    return this.#tag;
  }
  get user() {
    return this.#user;
  }

  isRecent(hours = 24) {
    const hoursDiff = (new Date() - this.#createdAt) / (1000 * 60 * 60);
    return hoursDiff <= hours;
  }

  hasTag() {
    return this.#tag !== null && this.#tag !== undefined;
  }

  hasUser() {
    return this.#user !== null && this.#user !== undefined;
  }

  isValid() {
    return this.hasTag() && this.hasUser();
  }

  toJSON() {
    return {
      id: this.#id,
      userId: this.#userId,
      tagId: this.#tagId,
      createdAt: this.#createdAt.toISOString(),
      tag: this.#tag
        ? this.#tag.toJSON
          ? this.#tag.toJSON()
          : this.#tag
        : null,
      user: this.#user
        ? this.#user.toJSON
          ? this.#user.toJSON()
          : {
              id: this.#user.id,
              userName: this.#user.userName,
            }
        : null,
      isRecent: this.isRecent(),
      isValid: this.isValid(),
    };
  }

  // statics
  static create({ userId, tagId, user = null, tag = null }, errorFactory) {
    return new UserTag(
      {
        userId,
        tagId,
        user,
        tag,
        createdAt: new Date(),
      },
      errorFactory
    );
  }


  static assign({ user, tag }, errorFactory) {
    if (!user || !tag) {
      const validator = new DomainValidators(errorFactory);
      throw validator.error.createValidationError(
        "User and Tag are required for assignment",
        null,
        validator.codes.REQUIRED_FIELD
      );
    }

    if (!user.id || !tag.id) {
      const validator = new DomainValidators(errorFactory);
      throw validator.error.createValidationError(
        "User and Tag must have IDs for assignment",
        { userId: user.id, tagId: tag.id },
        validator.codes.REQUIRED_FIELD
      );
    }

    return new UserTag(
      {
        userId: user.id,
        tagId: tag.id,
        user,
        tag,
        createdAt: new Date(),
      },
      errorFactory
    );
  }

  static createBulkAssignments(user, tags = [], errorFactory) {
    if (!user || !user.id) {
      const validator = new DomainValidators(errorFactory);
      throw validator.error.createValidationError(
        "Valid user is required for bulk assignment",
        { user: user, userId: user ? user.id : null },
        validator.codes.REQUIRED_FIELD
      );
    }

    return tags.map((tag) => UserTag.assign({ user, tag }, errorFactory));
  }
}

module.exports = UserTag;
