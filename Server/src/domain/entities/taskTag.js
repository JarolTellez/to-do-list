const DomainValidators = require("../utils/domainValidators");
const {
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
} = require("../errors/domainError");
const Tag = require("../entities/tag");
const Task = require("../entities/task");

class TaskTag {
  #id;
  #taskId;
  #tagId;
  #createdAt;
  #tag;
  #toDelete;
  #validator;
  #config;

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

  assignTag(tag) {
    this.#tag = this.#validateTag(tag);
  }

  assignTaskId(taskId) {
    this.#taskId = this.#validator.validateId(taskId, "Task");
  }

  updateCreatedAt(createdAt) {
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt", {
      required: true,
      entity: "TaskTag",
    });
  }

  markForDeletion() {
    this.#toDelete = true;
  }

  unmarkForDeletion() {
    this.#toDelete = false;
  }

  getMaxTagsPerTask() {
    return this.#config.TASK_TAG.MAX_TAGS_PER_TASK;
  }

  getMaxTagsPerUser() {
    return this.#config.USER_TAG.MAX_TAGS_PER_USER;
  }

  // Getters
  get id() {
    return this.#id;
  }
  get taskId() {
    return this.#taskId;
  }
  get tagId() {
    if (this.#tag && this.#tag.id) {
      return this.#tag.id;
    }
    return this.#tagId;
  }
  get createdAt() {
    return this.#createdAt;
  }
  get tag() {
    return this.#tag;
  }
  get toDelete() {
    return this.#toDelete;
  }

  isRecent(hours = 24) {
    const hoursDiff = (new Date() - this.#createdAt) / (1000 * 60 * 60);
    return hoursDiff <= hours;
  }

  hasTag() {
    return this.#tag !== null && this.#tag !== undefined;
  }

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

  static create({ taskId = null, tagId = null, tag = null, toDelete = false }) {
    return new TaskTag({
      taskId,
      tagId,
      tag,
      createdAt: new Date(),
      toDelete,
    });
  }

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
