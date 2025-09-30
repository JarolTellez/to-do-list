const DomainValidators = require("../utils/domainValidators");
const Tag = require("../entities/tag");
const Task = require("../entities/task");

class TaskTag {
  #id;
  #taskId;
  #createdAt;
  #tag;
  #toDelete;
  #validator;

  constructor(
    {
      id = null,
      taskId=null,
      createdAt = new Date(),
      tag = null,
      toDelete = false,
    },
    errorFactory
  ) {
    this.#validator = new DomainValidators(errorFactory);

    this.#id = this.#validator.validateId(id, "TaskTag");
    this.#taskId = this.#validator.validateId(taskId, "Task");
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt");
    this.#tag = this.#validateTag(tag);
    this.#toDelete = !!toDelete;

    this.#validateBusinessRules();
  }

  #validateTag(tag) {
    if (tag === null || tag === undefined) return null;

    if (!(tag instanceof Tag)) {
      throw this.#validator.error.createValidationError(
        "Must provide an instance of Tag",
        null,
        this.#validator.codes.INVALID_FORMAT
      );
    }

    return tag;
  }

  #validateTask(task) {
    if (task === null || task === undefined) return null;

    if (!(task instanceof Task)) {
      throw this.#validator.error.createValidationError(
        "Must provide an instance of Task",
        null,
        this.#validator.codes.INVALID_FORMAT
      );
    }

    if (this.#taskId && task.id !== this.#taskId) {
      throw this.#validator.error.createValidationError(
        "Assigned task does not match taskId",
        { taskId: this.#taskId, taskIdFromObject: task.id },
        this.#validator.codes.BUSINESS_RULE_VIOLATION
      );
    }

    return task;
  }

  #validateBusinessRules() {

  }

  assignTag(tag) {
    this.#tag = this.#validateTag(tag);
    if (tag) {
      this.#tag = tag;
    }
  }

    assignTaskId(taskId) {
    this.#taskId = this.#validator.validateId(taskId, "Task");
  }


  updateCreatedAt(createdAt) {
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt");
  }

  markForDeletion() {
    this.#toDelete = true;
  }

  unmarkForDeletion() {
    this.#toDelete = false;
  }

  // Getters
  get id() {
    return this.#id;
  }
  get taskId() {
    return this.#taskId;
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
    };
  }

  static create(
    { taskId, tag = null, toDelete = false },
    errorFactory
  ) {
    return new TaskTag(
      {
        taskId,
        tag,
        createdAt: new Date(),
        toDelete,
      },
      errorFactory
    );
  }

  static assign({tag, taskId, toDelete = false }, errorFactory) {
    const validator = new DomainValidators(errorFactory);
    if ( !tag) {
      throw validator.error.createValidationError(
        "Task and Tag are required for assignment",
        null,
        validator.codes.REQUIRED_FIELD
      );
    }
    return new TaskTag(
      {
        taskId,
        tag,
        createdAt: new Date(),
        toDelete,
      },
      errorFactory
    );
  }
}

module.exports = TaskTag;
