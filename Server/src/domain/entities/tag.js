const DomainValidators = require("../utils/domainValidators");
const {
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
} = require("../errors/domainError");
const domainValidationConfig = require("../config/domainValidationConfig");

/**
 * Tag domain entity representing categorization labels for tasks
 * @class Tag
 * @description Manages tag properties, validation, and business rules for categorization system
 */
class Tag {
  #id;
  #name;
  #description;
  #createdAt;
  #taskTags;
  #userTags;
  #validator;
  #config;

  /**
   * Creates a new Tag instance with validated properties
   * @constructor
   * @param {Object} tagData - Tag initialization data
   * @param {string|number} [tagData.id=null] - Unique tag identifier
   * @param {string} tagData.name - Tag name for identification
   * @param {string} [tagData.description=""] - Optional tag description
   * @param {Date} [tagData.createdAt=new Date()] - Tag creation timestamp
   * @param {Array} [tagData.taskTags=[]] - Associated task tags collection
   * @param {Array} [tagData.userTags=[]] - Associated user tags collection
   */
  constructor({
    id = null,
    name,
    description = "",
    createdAt = new Date(),
    taskTags = [],
    userTags = [],
  }) {
    this.#validator = new DomainValidators();
    this.#config = domainValidationConfig.TAG;

    this.#id = this.#validator.validateId(id, "Tag");
    this.#name = this.#validateName(name);
    this.#description = this.#validator.validateText(
      description,
      "description",
      {
        required: false,
        max: this.#config.DESCRIPTION.MAX_LENGTH,
        entity: "Tag",
      }
    );
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt", {
      required: true,
      entity: "Tag",
    });
    this.#taskTags = this.#validator.validateCollection(taskTags, "taskTags");
    this.#userTags = this.#validator.validateCollection(userTags, "userTags");
  }

  /**
   * Validates tag name format and length constraints
   * @private
   * @param {string} name - Tag name to validate
   * @returns {string} Validated tag name
   * @throws {ValidationError} When name format is invalid
   */
  #validateName(name) {
    return this.#validator.validateText(name, "name", {
      min: this.#config.NAME.MIN_LENGTH,
      max: this.#config.NAME.MAX_LENGTH,
      required: true,
      entity: "Tag",
    });
  }

  // bussiness logic

  /**
   * Updates tag name with validation
   * @param {string} newName - New name for the tag
   * @throws {ValidationError} When new name is invalid
   */
  updateName(newName) {
    this.#name = this.#validateName(newName);
  }

  /**
   * Updates tag description with validation
   * @param {string} newDescription - New description for the tag
   * @throws {ValidationError} When description exceeds length limits
   */
  updateDescription(newDescription) {
    this.#description = this.#validator.validateText(
      newDescription,
      "description",
      {
        required: false,
        max: this.#config.DESCRIPTION.MAX_LENGTH,
        entity: "Tag",
      }
    );
  }

  /**
   * Associates a task tag with this tag
   * @param {Object} taskTag - Task tag object to associate
   */
  addTaskTag(taskTag) {
    if (!this.#taskTags.some((tt) => tt.id === taskTag.id)) {
      this.#taskTags.push(taskTag);
    }
  }

  /**
   * Removes task tag association by ID
   * @param {string|number} taskTagId - Task tag identifier to remove
   */
  removeTaskTag(taskTagId) {
    this.#taskTags = this.#taskTags.filter((tt) => tt.id !== taskTagId);
  }

  /**
   * Associates a user tag with this tag
   * @param {Object} userTag - User tag object to associate
   */
  addUserTag(userTag) {
    if (!this.#userTags.some((ut) => ut.id === userTag.id)) {
      this.#userTags.push(userTag);
    }
  }

  /**
   * Removes user tag association by ID
   * @param {string|number} userTagId - User tag identifier to remove
   */
  removeUserTag(userTagId) {
    this.#userTags = this.#userTags.filter((ut) => ut.id !== userTagId);
  }

  // Getters
  /**
   * Gets tag unique identifier
   * @returns {string|number|null} Tag ID
   */
  get id() {
    return this.#id;
  }

  /**
   * Gets tag name
   * @returns {string} Tag name
   */
  get name() {
    return this.#name;
  }

  /**
   * Gets tag description
   * @returns {string} Tag description
   */
  get description() {
    return this.#description;
  }
  /**
   * Gets tag creation timestamp
   * @returns {Date} Creation date
   */
  get createdAt() {
    return this.#createdAt;
  }

  /**
   * Gets associated task tags (defensive copy)
   * @returns {Array} Task tags collection
   */
  get taskTags() {
    return [...this.#taskTags];
  }
  /**
   * Gets associated user tags (defensive copy)
   * @returns {Array} User tags collection
   */
  get userTags() {
    return [...this.#userTags];
  }

  /**
   * Checks if tag is assigned to any task
   * @returns {boolean} True if assigned to any task
   */
  isAssignedToAnyTask() {
    return this.#taskTags.length > 0;
  }

  /**
   * Checks if tag is assigned to any user
   * @returns {boolean} True if assigned to any user
   */
  isAssignedToAnyUser() {
    return this.#userTags.length > 0;
  }

  /**
   * Determines if tag can be safely deleted
   * @returns {boolean} True if not assigned to any task or user
   */
  canBeDeleted() {
    return !this.isAssignedToAnyTask() && !this.isAssignedToAnyUser();
  }

  /**
   * Gets maximum allowed length for tag name
   * @returns {number} Maximum name length
   */
  getNameMaxLength() {
    return this.#config.NAME.MAX_LENGTH;
  }
  /**
   * Gets maximum allowed length for tag description
   * @returns {number} Maximum description length
   */
  getDescriptionMaxLength() {
    return this.#config.DESCRIPTION.MAX_LENGTH;
  }

  /**
   * Gets usage limits for tag relationships
   * @returns {Object} Limits configuration
   */
  getUsageLimits() {
    return {
      maxTagsPerUser:
        domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER,
      maxTagsPerTask:
        domainValidationConfig.RELATIONSHIPS.TASK_TAG.MAX_TAGS_PER_TASK,
    };
  }

  /**
   * Converts tag to plain object for serialization
   * @returns {Object} Tag data as plain object
   */
  toJSON() {
    return {
      id: this.#id,
      name: this.#name,
      description: this.#description,
      createdAt: this.#createdAt.toISOString(),
      taskTagsCount: this.#taskTags.length,
      userTagsCount: this.#userTags.length,
      canBeDeleted: this.canBeDeleted(),
      limits: {
        nameMaxLength: this.#config.NAME.MAX_LENGTH,
        descriptionMaxLength: this.#config.DESCRIPTION.MAX_LENGTH,
        maxTagsPerUser:
          domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER,
        maxTagsPerTask:
          domainValidationConfig.RELATIONSHIPS.TASK_TAG.MAX_TAGS_PER_TASK,
      },
    };
  }

  /**
   * Factory method to create a new tag instance
   * @static
   * @param {Object} tagData - Tag creation data
   * @param {string|number} [tagData.id=null] - Tag identifier
   * @param {string} tagData.name - Tag name
   * @param {string} [tagData.description=""] - Tag description
   * @returns {Tag} New tag instance
   */
  static create({ id = null, name, description = "" }) {
    return new Tag({
      id,
      name,
      description,
      createdAt: new Date(),
    });
  }
}

module.exports = Tag;
