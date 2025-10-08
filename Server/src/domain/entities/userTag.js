const DomainValidators = require("../utils/domainValidators");
const {
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
} = require("../errors/domainError");
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
  #config;

  constructor({
    id = null,
    userId,
    tagId,
    createdAt = new Date(),
    tag = null,
    user = null,
  }) {
    this.#validator = new DomainValidators();
    this.#config = domainValidationConfig.RELATIONSHIPS;

    this.#id = this.#validator.validateId(id, "UserTag");
    this.#userId = this.#validator.validateId(userId, "User");
    this.#tagId = this.#validator.validateId(tagId, "Tag");
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt", {
      required: true,
      entity: "UserTag",
    });
    this.#tag = this.#validateTag(tag);
    this.#user = this.#validateUser(user);

    this.#validateBusinessRules();
  }

  #validateTag(tag) {
    if (tag === null || tag === undefined) return null;

    if (!(tag instanceof Tag)) {
      throw new ValidationError(
        "Debe proporcionar una instancia válida de Tag",
        {
          entity: "UserTag",
          field: "tag",
          expectedType: "Tag",
          actualType: tag ? tag.constructor.name : typeof tag,
        }
      );
    }

    if (this.#tagId && tag.id !== this.#tagId) {
      throw new ValidationError("El tag asignado no coincide con el tagId", {
        entity: "UserTag",
        tagId: this.#tagId,
        tagIdFromObject: tag.id,
      });
    }

    return tag;
  }

  #validateUser(user) {
    if (user === null || user === undefined) return null;

    if (!(user instanceof User)) {
      throw new ValidationError(
        "Debe proporcionar una instancia válida de User",
        {
          entity: "UserTag",
          field: "user",
          expectedType: "User",
          actualType: user ? user.constructor.name : typeof user,
        }
      );
    }

    if (this.#userId && user.id !== this.#userId) {
      throw new ValidationError(
        "El usuario asignado no coincide con el userId",
        {
          entity: "UserTag",
          userId: this.#userId,
          userIdFromObject: user.id,
        }
      );
    }

    return user;
  }

  #validateBusinessRules() {
    if (!this.#userId || !this.#tagId) {
      throw new RequiredFieldError("userId y tagId", {
        entity: "UserTag",
        userId: this.#userId,
        tagId: this.#tagId,
      });
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
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt", {
      required: true,
      entity: "UserTag",
    });
  }

  updateId(id) {
    this.#id = this.#validator.validateId(id, "UserTag");
  }

  getMaxTagsPerUser() {
    return this.#config.USER_TAG.MAX_TAGS_PER_USER;
  }

  getMaxTagsPerTask() {
    return this.#config.TASK_TAG.MAX_TAGS_PER_TASK;
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
              username: this.#user.username,
            }
        : null,
      limits: {
        maxTagsPerUser: this.#config.USER_TAG.MAX_TAGS_PER_USER,
        maxTagsPerTask: this.#config.TASK_TAG.MAX_TAGS_PER_TASK,
      },
    };
  }

  // statics
  static create({ userId, tagId, user = null, tag = null }) {
    return new UserTag({
      userId,
      tagId,
      user,
      tag,
      createdAt: new Date(),
    });
  }

  static assign({ user, tag }) {
    if (!user || !tag) {
      throw new RequiredFieldError("user y tag", {
        entity: "UserTag",
        operation: "assign",
      });
    }

    if (!user.id || !tag.id) {
      throw new ValidationError(
        "El usuario y el tag deben tener IDs para la asignación",
        {
          entity: "UserTag",
          userId: user.id,
          tagId: tag.id,
        }
      );
    }

    return new UserTag({
      userId: user.id,
      tagId: tag.id,
      user,
      tag,
      createdAt: new Date(),
    });
  }

  static createBulkAssignments(user, tags = [], errorFactory) {
    if (!user || !user.id) {
      throw new ValidationError(
        "Se requiere un usuario válido para la asignación masiva",
        {
          entity: "UserTag",
          user: user,
          userId: user ? user.id : null,
        }
      );
    }

    if (!Array.isArray(tags)) {
      throw new InvalidFormatError("tags", "array", {
        entity: "UserTag",
        field: "tags",
        operation: "createBulkAssignments",
      });
    }

    if (
      tags.length >
      domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER
    ) {
      throw new ValidationError(
        `No se pueden asignar más de ${domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER} tags por usuario`,
        {
          entity: "UserTag",
          operation: "createBulkAssignments",
          currentCount: tags.length,
          maxAllowed:
            domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER,
        }
      );
    }

    return tags.map((tag) => UserTag.assign({ user, tag }));
  }
}

module.exports = UserTag;
