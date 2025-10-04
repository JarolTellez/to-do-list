const DomainValidators = require("../utils/domainValidators");
const TaskTag = require("../entities/taskTag");

class Task {
  #id;
  #name;
  #description;
  #scheduledDate;
  #createdAt;
  #updatedAt;
  #isCompleted;
  #userId;
  #priority;
  #taskTags;
  #validator;

  constructor(
    {
      id = null,
      name,
      description = "",
      scheduledDate = null,
      createdAt = new Date(),
      updatedAt = new Date(),
      isCompleted = false,
      userId,
      priority = null,
      taskTags = [],
    },
    errorFactory
  ) {
    this.#validator = new DomainValidators(errorFactory);

    this.#validateRequiredFields({ name, userId });

    this.#id = this.#validator.validateId(id, "Task");
    this.#name = this.#validateName(name);
    this.#description = this.#validator.validateText(
      description,
      "description",
      {
        max: 1000,
        entity: "Task",
      }
    );
    this.#scheduledDate = this.#validateScheduledDate(scheduledDate);
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt");
    this.#updatedAt = this.#validator.validateDate(updatedAt, "updatedAt");
    this.#isCompleted = this.#validator.validateBoolean(
      isCompleted,
      "isCompleted",
      "Task"
    );
    this.#userId = this.#validator.validateId(userId, "User");
    this.#priority = this.#validatePriority(priority);
    this.#taskTags = this.#validator.validateCollection(taskTags, "taskTags");

    this.#validateBusinessRules();
  }

  #validateRequiredFields({ name, userId }) {
    const missingFields = [];

    if (!name || name.trim().length === 0) {
      missingFields.push("name");
    }

    if (!userId) {
      missingFields.push("userId");
    }

    if (missingFields.length > 0) {
      throw this.#validator.errorFactory.createValidationError(
        `Missing required fields: ${missingFields.join(", ")}`,
        { missingFields },
        this.#validator.codes.REQUIRED_FIELD
      );
    }
  }

  #validateName(name) {
    const validated = this.#validator.validateText(name, "name", {
      min: 1,
      max: 30,
      required: true,
      entity: "Task",
    });
    return validated;
  }

  #validateScheduledDate(scheduledDate) {
    if (!scheduledDate) return null;

    const date = this.#validator.validateDate(scheduledDate, "scheduledDate");

    if (date < new Date()) {
      throw this.#validator.error.createValidationError(
        "Scheduled date cannot be in the past",
        { field: "scheduledDate", value: date },
        this.#validator.codes.INVALID_DATE
      );
    }

    return date;
  }

  #validatePriority(priority) {
    if (priority === null || priority === undefined) return null;

    if (typeof priority !== "number" || priority < 1 || priority > 5) {
      throw this.#validator.error.createValidationError(
        "Priority must be a number between 1 and 5",
        { field: "priority", value: priority, min: 1, max: 5 },
        this.#validator.codes.INVALID_FORMAT
      );
    }

    return priority;
  }

  #validateBusinessRules() {
    if (
      this.#scheduledDate &&
      this.#scheduledDate < new Date() &&
      !this.#isCompleted
    ) {
      throw this.#validator.error.createValidationError(
        "Incomplete task cannot have past scheduled date",
        { field: "scheduledDate", value: this.#scheduledDate },
        this.#validator.codes.BUSINESS_RULE_VIOLATION
      );
    }
  }

  complete() {

     if (this.#isCompleted) {
    throw this.#validator.errorFactory.createValidationError(
      "Task is already completed",
      { taskId: this.#id },
      this.#validator.codes.BUSINESS_RULE_VIOLATION
    );
  }

    this.#isCompleted = true;
    this.#updatedAt = new Date();
  }

  uncomplete() {
    this.#isCompleted = false;
    this.#updatedAt = new Date();
  }

  updatePriority(newPriority) {
    this.#priority = this.#validatePriority(newPriority);
    this.#updatedAt = new Date();
  }

  updateName(newName) {
    this.#name = this.#validateName(newName);
    this.#updatedAt = new Date();
  }

  updateDescription(newDescription) {
    this.#description = this.#validator.validateText(
      newDescription,
      "description",
      {
        max: 1000,
        entity: "Task",
      }
    );
    this.#updatedAt = new Date();
  }

  addTaskTag(taskTag) {
    if (!(taskTag instanceof TaskTag)) {
      throw this.#validator.errorFactory.createValidationError(
        "Must provide an instance of TaskTag",
        null,
        this.#validator.codes.INVALID_FORMAT
      );
    }
    if (!this.#taskTags.some((tt) => tt.tagId === taskTag.tagId)) {
      this.#taskTags.push(taskTag);
      this.#updatedAt = new Date();
    }
  }

  addTagsByIds(tagIds = []) {
    tagIds.forEach((tagId) => this.addTagById(tagId));
  }
  addTagById(tagId) {
    const taskTag = TaskTag.createFromTagId(
      {
        taskId: this.#id,
        tagId: tagId,
      },
      this.#validator.errorFactory
    );
    this.addTaskTag(taskTag);
  }
  addTagsByIds(tagIds = []) {
    tagIds.forEach((tagId) => this.addTagById(tagId));
  }

  setTaskTags(newTaskTags) {
    if (!Array.isArray(newTaskTags)) {
      throw this.#validator.errorFactory.createValidationError(
        "taskTags must be an array",
        null,
        this.#validator.codes.INVALID_FORMAT
      );
    }
    newTaskTags.forEach((taskTag) => {
      if (!(taskTag instanceof TaskTag)) {
        throw this.#validator.errorFactory.createValidationError(
          "All taskTags must be instances of TaskTag",
          null,
          this.#validator.codes.INVALID_FORMAT
        );
      }
    });

    this.#taskTags = [...newTaskTags];
    this.#updatedAt = new Date();
  }

  removeTaskTag(taskTagId) {
    const initialLength = this.#taskTags.length;
    this.#taskTags = this.#taskTags.filter((tt) => tt.id !== taskTagId);

    if (this.#taskTags.length !== initialLength) {
      this.#updatedAt = new Date();
    }
  }

  hasTag(tagId) {
    return this.#taskTags.some((tt) => tt.tagId === tagId);
  }

  //Getters
  get id() {
    return this.#id;
  }
  get name() {
    return this.#name;
  }
  get description() {
    return this.#description;
  }
  get scheduledDate() {
    return this.#scheduledDate;
  }
  get createdAt() {
    return this.#createdAt;
  }
  get updatedAt() {
    return this.#updatedAt;
  }
  get isCompleted() {
    return this.#isCompleted;
  }
  get userId() {
    return this.#userId;
  }
  get priority() {
    return this.#priority;
  }
  get taskTags() {
    return [...this.#taskTags];
  }

  isOverdue() {
    return (
      this.#scheduledDate &&
      new Date() > new Date(this.#scheduledDate) &&
      !this.#isCompleted
    );
  }

  isScheduledForToday() {
    if (!this.#scheduledDate) return false;

    const today = new Date();
    const scheduled = new Date(this.#scheduledDate);

    return scheduled.toDateString() === today.toDateString();
  }

  getTags() {
    return this.#taskTags
      .map((taskTag) => taskTag.tag)
      .filter((tag) => tag !== undefined);
  }

  toJSON() {
    return {
      id: this.#id,
      name: this.#name,
      description: this.#description,
      scheduledDate: this.#scheduledDate,
      createdAt: this.#createdAt,
      updatedAt: this.#updatedAt,
      isCompleted: this.#isCompleted,
      userId: this.#userId,
      priority: this.#priority,
      taskTags: this.#taskTags.map((taskTag) =>
        taskTag.toJSON ? taskTag.toJSON() : taskTag
      ),
      isOverdue: this.isOverdue(),
      isScheduledForToday: this.isScheduledForToday(),
    };
  }

  static create(
    {
      name,
      description = "",
      userId,
      scheduledDate = null,
      priority = null,
      taskTags = [],
    },
    errorFactory
  ) {
    return new Task(
      {
        name,
        description,
        userId,
        scheduledDate,
        priority,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        taskTags: taskTags,
      },
      errorFactory
    );
  }
}

module.exports = Task;
