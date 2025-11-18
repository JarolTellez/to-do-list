const DomainValidators = require("../utils/domainValidators");
const {
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
} = require("../errors/domainError");
const Tag = require("../entities/tag");
const User = require("../entities/user");
const domainValidationConfig = require("../config/domainValidationConfig");

/**
 * UserTag domain entity representing the relationship between users and tags
 * @class UserTag
 * @description Manages user-tag associations with validation and integrity constraints
 */
class UserTag {
  #id;
  #userId;
  #tagId;
  #createdAt;
  #tag;
  #user;
  #validator;
  #config;

  /**
   * Creates a new UserTag instance with validated properties
   * @constructor
   * @param {Object} userTagData - UserTag initialization data
   * @param {string|number} [userTagData.id=null] - Unique user-tag relationship identifier
   * @param {string|number} userTagData.userId - Associated user identifier
   * @param {string|number} userTagData.tagId - Associated tag identifier
   * @param {Date} [userTagData.createdAt=new Date()] - Relationship creation timestamp
   * @param {Tag} [userTagData.tag=null] - Associated Tag entity instance
   * @param {User} [userTagData.user=null] - Associated User entity instance
   */
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
  /**
   * Validates tag instance is proper Tag entity and matches tagId
   * @private
   * @param {Tag} tag - Tag instance to validate
   * @returns {Tag|null} Validated tag instance or null
   * @throws {ValidationError} When tag is invalid or ID mismatch
   */
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

  /**
   * Validates user instance is proper User entity and matches userId
   * @private
   * @param {User} user - User instance to validate
   * @returns {User|null} Validated user instance or null
   * @throws {ValidationError} When user is invalid or ID mismatch
   */
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

  /**
   * Validates business rules for relationship integrity
   * @private
   * @throws {RequiredFieldError} When required IDs are missing
   */
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
  /**
   * Assigns a Tag entity to this relationship
   * @param {Tag} tag - Tag instance to associate
   */
  assignTag(tag) {
    this.#tag = this.#validateTag(tag);
    if (tag) {
      this.#tagId = tag.id;
    }
  }

  /**
   * Assigns a User entity to this relationship
   * @param {User} user - User instance to associate
   */
  assignUser(user) {
    this.#user = this.#validateUser(user);
    if (user) {
      this.#userId = user.id;
    }
  }

  /**
   * Updates the creation timestamp of the relationship
   * @param {Date} createdAt - New creation timestamp
   */
  updateCreatedAt(createdAt) {
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt", {
      required: true,
      entity: "UserTag",
    });
  }
  /**
   * Updates the relationship identifier
   * @param {string|number} id - New relationship ID
   */
  updateId(id) {
    this.#id = this.#validator.validateId(id, "UserTag");
  }

  /**
   * Gets maximum allowed tags per user from configuration
   * @returns {number} Maximum tags per user limit
   */
  getMaxTagsPerUser() {
    return this.#config.USER_TAG.MAX_TAGS_PER_USER;
  }

  /**
   * Gets maximum allowed tags per task from configuration
   * @returns {number} Maximum tags per task limit
   */
  getMaxTagsPerTask() {
    return this.#config.TASK_TAG.MAX_TAGS_PER_TASK;
  }

  //Getters
  /**
   * Gets relationship unique identifier
   * @returns {string|number|null} UserTag ID
   */
  get id() {
    return this.#id;
  }

  /**
   * Gets associated user identifier
   * @returns {string|number} User ID
   */
  get userId() {
    return this.#userId;
  }
  /**
   * Gets associated tag identifier
   * @returns {string|number} Tag ID
   */
  get tagId() {
    return this.#tagId;
  }
  /**
   * Gets relationship creation timestamp
   * @returns {Date} Creation date
   */
  get createdAt() {
    return this.#createdAt;
  }
  /**
   * Gets associated Tag entity instance
   * @returns {Tag|null} Tag entity
   */
  get tag() {
    return this.#tag;
  }
  /**
   * Gets associated User entity instance
   * @returns {User|null} User entity
   */
  get user() {
    return this.#user;
  }

  /**
   * Checks if relationship was created within specified hours
   * @param {number} [hours=24] - Hours threshold for recent check
   * @returns {boolean} True if created within specified hours
   */
  isRecent(hours = 24) {
    const hoursDiff = (new Date() - this.#createdAt) / (1000 * 60 * 60);
    return hoursDiff <= hours;
  }

  /**
   * Checks if relationship has an associated tag
   * @returns {boolean} True if tag is associated
   */
  hasTag() {
    return this.#tag !== null && this.#tag !== undefined;
  }

  /**
   * Checks if relationship has an associated user
   * @returns {boolean} True if user is associated
   */
  hasUser() {
    return this.#user !== null && this.#user !== undefined;
  }

  /**
   * Validates relationship has both required entities
   * @returns {boolean} True if relationship is valid
   */
  isValid() {
    return this.hasTag() && this.hasUser();
  }

  /**
   * Converts relationship to plain object for serialization
   * @returns {Object} UserTag data as plain object
   */
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

  /**
   * Factory method to create a new user-tag relationship
   * @static
   * @param {Object} relationshipData - Relationship creation data
   * @param {string|number} relationshipData.userId - User identifier
   * @param {string|number} relationshipData.tagId - Tag identifier
   * @param {User} [relationshipData.user=null] - User entity instance
   * @param {Tag} [relationshipData.tag=null] - Tag entity instance
   * @returns {UserTag} New UserTag instance
   */
  static create({ userId, tagId, user = null, tag = null }) {
    return new UserTag({
      userId,
      tagId,
      user,
      tag,
      createdAt: new Date(),
    });
  }

  /**
   * Factory method to create relationship with entity assignment
   * @static
   * @param {Object} assignmentData - Assignment data
   * @param {User} assignmentData.user - User entity to assign
   * @param {Tag} assignmentData.tag - Tag entity to assign
   * @returns {UserTag} New UserTag instance with assigned entities
   * @throws {RequiredFieldError} When user or tag are not provided
   * @throws {ValidationError} When entities lack IDs
   */
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

  /**
   * Creates multiple user-tag relationships in bulk
   * @static
   * @param {User} user - User entity for all assignments
   * @param {Array} tags - Array of Tag entities to associate
   * @param {Object} [errorFactory] - Error factory for validation errors
   * @returns {Array} Array of UserTag instances
   * @throws {ValidationError} When user is invalid or tags exceed limits
   */
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
