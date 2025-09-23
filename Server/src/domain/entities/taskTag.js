const DomainValidators = require("./validators/DomainValidators");
const Tag = require("../entities/tag");
const Task = require("../entities/task");

class TaskTag {
  #id;
  #taskId;
  #tagId;
  #createdAt;
  #tag;
  #task;
  #toDelete;
  #validator;

  constructor(
    {
      id = null,
      taskId,
      tagId,
      createdAt = new Date(),
      tag = null,
      task = null,
      toDelete = false,
    },
    errorFactory
  ) {
    this.#validator = new DomainValidators(errorFactory);

    this.#id = this.#validator.validateId(id, "TaskTag");
    this.#taskId = this.#validator.validateId(taskId, "Task");
    this.#tagId = this.#validator.validateId(tagId, "Tag");
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt");
    this.#task = this.#validateTask(task);
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

    if (this.#tagId && tag.id !== this.#tagId) {
      throw this.#validator.error.createValidationError(
        "Assigned tag does not match tagId",
        { tagId: this.#tagId, tagIdFromObject: tag.id },
        this.#validator.codes.BUSINESS_RULE_VIOLATION
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
    if (!this.#taskId || !this.#tagId) {
      throw this.#validator.error.createValidationError(
        "TaskId and TagId are required",
        { taskId: this.#taskId, tagId: this.#tagId },
        this.#validator.codes.REQUIRED_FIELD
      );
    }
  }

  assignTag(tag) {
    this.#tag = this.#validateTag(tag);
    if (tag) {
      this.#tagId = tag.id;
    }
  }

  assignTask(task) {
    this.#task = this.#validateTask(task);
    if (task) {
      this.#taskId = task.id;
    }
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
  get tagId() {
    return this.#tagId;
  }
  get createdAt() {
    return this.#createdAt;
  }
  get tag() {
    return this.#tag;
  }
  get task() {
    return this.#task;
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

  hasTask() {
    return this.#task !== null && this.#task !== undefined;
  }

  toJSON() {
    return {
      id: this.#id,
      taskId: this.#taskId,
      tagId: this.#tagId,
      createdAt: this.#createdAt.toISOString(),
      tag: this.#tag
        ? this.#tag.toJSON
          ? this.#tag.toJSON()
          : this.#tag
        : null,
      task: this.#task
        ? this.#task.toJSON
          ? this.#task.toJSON()
          : this.#task
        : null,
      toDelete: this.#toDelete,
      isRecent: this.isRecent(),
    };
  }

  static create(
    { taskId, tagId, task = null, tag = null, toDelete = false },
    errorFactory
  ) {
    return new TaskTag(
      {
        taskId,
        tagId,
        task,
        tag,
        createdAt: new Date(),
        toDelete,
      },
      errorFactory
    );
  }

  static assign({ task, tag, toDelete = false }, errorFactory) {
    const validator = new DomainValidators(errorFactory);
    if (!task || !tag) {
      throw validator.error.createValidationError(
        "Task and Tag are required for assignment",
        null,
        validator.codes.REQUIRED_FIELD
      );
    }
    return new TaskTag(
      {
        taskId: task.id,
        tagId: tag.id,
        task,
        tag,
        createdAt: new Date(),
        toDelete,
      },
      errorFactory
    );
  }
}

module.exports = TaskTag;
