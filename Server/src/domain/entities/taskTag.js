const DomainValidators = require("../utils/domainValidators");
const {
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
} = require("../errors/domainError");
const Tag = require("../entities/tag");
const Task = require("../entities/task");
const domainValidationConfig = require("../config/domainValidationConfig");

/**
 * TaskTag domain entity representing the relationship between tasks and tags
 * @class TaskTag
 * @description Manages task-tag associations with validation and lifecycle tracking
 */
class TaskTag {
  #id;
  #taskId;
  #tagId;
  #createdAt;
  #tag;
  #toDelete;
  #validator;
  #config;

  /**
   * Creates a new TaskTag instance with validated properties
   * @constructor
   * @param {Object} taskTagData - TaskTag initialization data
   * @param {string|number} [taskTagData.id=null] - Unique task-tag relationship identifier
   * @param {string|number} [taskTagData.taskId=null] - Associated task identifier
   * @param {string|number} [taskTagData.tagId=null] - Associated tag identifier
   * @param {Date} [taskTagData.createdAt=new Date()] - Relationship creation timestamp
   * @param {Tag} [taskTagData.tag=null] - Associated Tag entity instance
   * @param {boolean} [taskTagData.toDelete=false] - Marked for deletion status
   */
  constructor({
    id = null,
    taskId = null,
    tagId = null,
    createdAt = new Date(),
    tag = null,
    toDelete = false,
  }) {
    this.#validator = new DomainValidators();
    this.#config = domainValidationConfig.RELATIONSHIPS;

    this.#id = this.#validator.validateId(id, "TaskTag");
    this.#taskId = taskId ? this.#validator.validateId(taskId, "Task") : null;
    this.#tagId = tagId ? this.#validator.validateId(tagId, "Tag") : null;
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt", {
      required: true,
      entity: "TaskTag",
    });
    this.#tag = this.#validateTag(tag);
    this.#toDelete = this.#validator.validateBoolean(
      toDelete,
      "toDelete",
      "TaskTag"
    );
  }

  /**
   * Validates tag instance is proper Tag entity
   * @private
   * @param {Tag} tag - Tag instance to validate
   * @returns {Tag|null} Validated tag instance or null
   * @throws {ValidationError} When tag is not a valid Tag instance
   */
  #validateTag(tag) {
    if (tag === null || tag === undefined) return null;

    if (!(tag instanceof Tag)) {
      throw new ValidationError(
        "Debe proporcionar una instancia válida de Tag",
        {
          entity: "TaskTag",
          field: "tag",
          expectedType: "Tag",
          actualType: tag ? tag.constructor.name : typeof tag,
        }
      );
    }

    return tag;
  }
  /**
   * Assigns a Tag entity to this relationship
   * @param {Tag} tag - Tag instance to associate
   */
  assignTag(tag) {
    this.#tag = this.#validateTag(tag);
  }
  /**
   * Assigns a task identifier to this relationship
   * @param {string|number} taskId - Task identifier to associate
   */
  assignTaskId(taskId) {
    this.#taskId = this.#validator.validateId(taskId, "Task");
  }
  /**
   * Updates the creation timestamp of the relationship
   * @param {Date} createdAt - New creation timestamp
   */
  updateCreatedAt(createdAt) {
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt", {
      required: true,
      entity: "TaskTag",
    });
  }
  /**
   * Marks the relationship for deletion
   */
  markForDeletion() {
    this.#toDelete = true;
  }

  /**
   * Removes deletion mark from the relationship
   */
  unmarkForDeletion() {
    this.#toDelete = false;
  }
  /**
   * Gets maximum allowed tags per task from configuration
   * @returns {number} Maximum tags per task limit
   */
  getMaxTagsPerTask() {
    return this.#config.TASK_TAG.MAX_TAGS_PER_TASK;
  }
  /**
   * Gets maximum allowed tags per user from configuration
   * @returns {number} Maximum tags per user limit
   */
  getMaxTagsPerUser() {
    return this.#config.USER_TAG.MAX_TAGS_PER_USER;
  }

  // Getters
  /**
   * Gets relationship unique identifier
   * @returns {string|number|null} TaskTag ID
   */
  get id() {
    return this.#id;
  }
  /**
   * Gets associated task identifier
   * @returns {string|number|null} Task ID
   */
  get taskId() {
    return this.#taskId;
  }
  /**
   * Gets associated tag identifier (prefers tag entity ID if available)
   * @returns {string|number|null} Tag ID
   */
  get tagId() {
    if (this.#tag && this.#tag.id) {
      return this.#tag.id;
    }
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
   * Gets deletion marked status
   * @returns {boolean} True if marked for deletion
   */
  get toDelete() {
    return this.#toDelete;
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
   * Converts relationship to plain object for serialization
   * @returns {Object} TaskTag data as plain object
   */
  toJSON() {
    return {
      id: this.#id,
      taskId: this.#taskId,
      createdAt: this.#createdAt.toISOString(),
      tag: this.#tag
        ? this.#tag.toJSON
          ? this.#tag.toJSON()
          : this.#tag
        : null,
      toDelete: this.#toDelete,
      isRecent: this.isRecent(),
      isValid: this.isValid(),
      limits: {
        maxTagsPerTask: this.#config.TASK_TAG.MAX_TAGS_PER_TASK,
        maxTagsPerUser: this.#config.USER_TAG.MAX_TAGS_PER_USER,
      },
    };
  }

  /**
   * Factory method to create a new task-tag relationship
   * @static
   * @param {Object} relationshipData - Relationship creation data
   * @param {string|number} [relationshipData.taskId=null] - Task identifier
   * @param {string|number} [relationshipData.tagId=null] - Tag identifier
   * @param {Tag} [relationshipData.tag=null] - Tag entity instance
   * @param {boolean} [relationshipData.toDelete=false] - Initial deletion status
   * @returns {TaskTag} New TaskTag instance
   */
  static create({ taskId = null, tagId = null, tag = null, toDelete = false }) {
    return new TaskTag({
      taskId,
      tagId,
      tag,
      createdAt: new Date(),
      toDelete,
    });
  }

  /**
   * Factory method to create relationship with tag assignment
   * @static
   * @param {Object} assignmentData - Assignment data
   * @param {Tag} assignmentData.tag - Tag entity to assign
   * @param {string|number} assignmentData.taskId - Task identifier to associate
   * @param {boolean} [assignmentData.toDelete=false] - Initial deletion status
   * @returns {TaskTag} New TaskTag instance with assigned tag
   * @throws {RequiredFieldError} When tag is not provided
   */
  static assign({ tag, taskId, toDelete = false }) {
    if (!tag) {
      throw new RequiredFieldError("tag", {
        entity: "TaskTag",
        operation: "assign",
      });
    }
    return new TaskTag({
      taskId,
      tag,
      createdAt: new Date(),
      toDelete,
    });
  }
}

module.exports = TaskTag;
