const DomainValidators = require("../utils/domainValidators");
const {
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
} = require("../errors/domainError");
const TaskTag = require("../entities/taskTag");
const domainValidationConfig = require("../config/domainValidationConfig");

/**
 * Task domain entity representing user tasks with scheduling and categorization
 * @class Task
 * @description Manages task properties, validation, business rules, and tag associations
 */
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
  #config;
  #skipValidations;

  /**
   * Creates a new Task instance with validated properties
   * @constructor
   * @param {Object} taskData - Task initialization data
   * @param {string|number} [taskData.id=null] - Unique task identifier
   * @param {string} taskData.name - Task name/title
   * @param {string} [taskData.description=""] - Task description
   * @param {Date} [taskData.scheduledDate=null] - Scheduled date for task completion
   * @param {Date} [taskData.createdAt=new Date()] - Task creation timestamp
   * @param {Date} [taskData.updatedAt=new Date()] - Task last update timestamp
   * @param {boolean} [taskData.isCompleted=false] - Task completion status
   * @param {string|number} taskData.userId - User identifier who owns the task
   * @param {number} [taskData.priority=null] - Task priority level
   * @param {Array} [taskData.taskTags=[]] - Associated task tags collection
   * @param {boolean} [taskData.skipValidations=false] - Skip business rule validations
   */
  constructor({
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
    skipValidations = false,
  }) {
    this.#validator = new DomainValidators();
    this.#config = domainValidationConfig.TASK;
    this.#skipValidations = skipValidations;

    this.#id = this.#validator.validateId(id, "Task");
    this.#name = this.#validateName(name);
    this.#description = this.#validator.validateText(
      description,
      "description",
      {
        required: false,
        max: this.#config.DESCRIPTION.MAX_LENGTH,
        entity: "Task",
      }
    );
    this.#scheduledDate = this.#validateScheduledDate(scheduledDate);
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt", {
      required: true,
      entity: "Task",
    });
    this.#updatedAt = this.#validator.validateDate(updatedAt, "updatedAt", {
      required: true,
      entity: "Task",
    });
    this.#isCompleted = this.#validator.validateBoolean(
      isCompleted,
      "isCompleted",
      "Task"
    );
    this.#userId = this.#validator.validateId(userId, "User");
    this.#priority = this.#validatePriority(priority);
    this.#taskTags = this.#validateTaskTags(taskTags);

    if (!this.#skipValidations) {
      this.#validateBusinessRules();
    }
  }

  /**
   * Validates task name format and length constraints
   * @private
   * @param {string} name - Task name to validate
   * @returns {string} Validated task name
   * @throws {ValidationError} When name format is invalid
   */
  #validateName(name) {
    const validated = this.#validator.validateText(name, "name", {
      min: this.#config.NAME.MIN_LENGTH,
      max: this.#config.NAME.MAX_LENGTH,
      required: true,
      entity: "Task",
    });
    return validated;
  }
  /**
   * Validates scheduled date is in the future for incomplete tasks
   * @private
   * @param {Date} scheduledDate - Scheduled date to validate
   * @returns {Date|null} Validated scheduled date or null
   * @throws {ValidationError} When date is in the past for incomplete task
   */
  #validateScheduledDate(scheduledDate) {
    if (!scheduledDate) return null;

    const date = this.#validator.validateDate(scheduledDate, "scheduledDate", {
      required: false,
      entity: "Task",
    });

    if (!this.#skipValidations) {
      const minFutureDate = new Date();
      minFutureDate.setMinutes(
        minFutureDate.getMinutes() +
          this.#config.SCHEDULED_DATE.MIN_FUTURE_MINUTES
      );

      if (date < minFutureDate) {
        throw new ValidationError(
          `La fecha programada debe ser al menos ${
            this.#config.SCHEDULED_DATE.MIN_FUTURE_MINUTES
          } minutos en el futuro`,
          {
            entity: "Task",
            field: "scheduledDate",
            value: date,
            minFutureMinutes: this.#config.SCHEDULED_DATE.MIN_FUTURE_MINUTES,
          }
        );
      }
    }

    return date;
  }
  /**
   * Validates priority value is within allowed range
   * @private
   * @param {number} priority - Priority value to validate
   * @returns {number|null} Validated priority or null
   * @throws {ValidationError} When priority is outside valid range
   */
  #validatePriority(priority) {
    if (priority === null || priority === undefined) return null;

    let priorityNumber = priority;
    if (typeof priority !== "number") {
      priorityNumber = Number(priority);

      if (isNaN(priorityNumber)) {
        throw new ValidationError(`La prioridad debe ser un número válido`, {
          entity: "Task",
          field: "priority",
          value: priority,
          expected: "number",
          received: typeof priority,
        });
      }
    }

    if (
      priorityNumber < this.#config.PRIORITY.MIN ||
      priorityNumber > this.#config.PRIORITY.MAX
    ) {
      throw new ValidationError(
        `La prioridad debe ser un número entre ${this.#config.PRIORITY.MIN} y ${
          this.#config.PRIORITY.MAX
        }`,
        {
          entity: "Task",
          field: "priority",
          value: priorityNumber,
          min: this.#config.PRIORITY.MIN,
          max: this.#config.PRIORITY.MAX,
        }
      );
    }

    return priorityNumber;
  }
  /**
   * Validates business rules for task consistency
   * @private
   * @throws {ValidationError} When business rules are violated
   */
  #validateBusinessRules() {
    if (this.#skipValidations) return;
    if (
      this.#scheduledDate &&
      this.#scheduledDate < new Date() &&
      !this.#isCompleted
    ) {
      throw new ValidationError(
        "Una tarea incompleta no puede tener una fecha programada en el pasado",
        {
          entity: "Task",
          field: "scheduledDate",
          value: this.#scheduledDate,
        }
      );
    }
  }

  /**
   * Validates task tags collection format and limits
   * @private
   * @param {Array} taskTags - Task tags collection to validate
   * @returns {Array} Validated task tags collection
   * @throws {ValidationError} When tags exceed limits or have invalid format
   */
  #validateTaskTags(taskTags) {
    if (!Array.isArray(taskTags)) {
      throw new InvalidFormatError("taskTags", "array", {
        entity: "Task",
        field: "taskTags",
        actualType: typeof taskTags,
      });
    }

    if (
      taskTags.length >
      domainValidationConfig.RELATIONSHIPS.TASK_TAG.MAX_TAGS_PER_TASK
    ) {
      throw new ValidationError(
        `No se pueden asignar más de ${domainValidationConfig.RELATIONSHIPS.TASK_TAG.MAX_TAGS_PER_TASK} tags por tarea`,
        {
          entity: "Task",
          field: "taskTags",
          currentCount: taskTags.length,
          maxAllowed:
            domainValidationConfig.RELATIONSHIPS.TASK_TAG.MAX_TAGS_PER_TASK,
        }
      );
    }

    const invalidTaskTags = taskTags.filter(
      (taskTag) => !(taskTag instanceof TaskTag)
    );
    if (invalidTaskTags.length > 0) {
      throw new ValidationError(
        "Todos los taskTags deben ser instancias de TaskTag",
        {
          entity: "Task",
          field: "taskTags",
          invalidTaskTagsCount: invalidTaskTags.length,
        }
      );
    }

    return [...taskTags];
  }

  /**
   * Marks task as completed and updates timestamp
   * @throws {ValidationError} When task is already completed
   */
  complete() {
    if (this.#isCompleted) {
      throw new ValidationError("La tarea ya está completada", {
        entity: "Task",
        taskId: this.#id,
      });
    }

    this.#isCompleted = true;
    this.#updatedAt = new Date();
  }

  /**
   * Marks task as incomplete and updates timestamp
   */
  uncomplete() {
    this.#isCompleted = false;
    this.#updatedAt = new Date();
  }
  /**
   * Updates task priority with validation
   * @param {number} newPriority - New priority value
   */
  updatePriority(newPriority) {
    this.#priority = this.#validatePriority(newPriority);
    this.#updatedAt = new Date();
  }
  /**
   * Updates task name with validation
   * @param {string} newName - New task name
   */
  updateName(newName) {
    this.#name = this.#validateName(newName);
    this.#updatedAt = new Date();
  }

  /**
   * Updates task description with validation
   * @param {string} newDescription - New task description
   */
  updateDescription(newDescription) {
    this.#description = this.#validator.validateText(
      newDescription,
      "description",
      {
        required: false,
        max: this.#config.DESCRIPTION.MAX_LENGTH,
        entity: "Task",
      }
    );
    this.#updatedAt = new Date();
  }

  /**
   * Adds a TaskTag instance to the task
   * @param {TaskTag} taskTag - TaskTag instance to add
   * @throws {ValidationError} When tag limit exceeded or invalid type
   */
  addTaskTag(taskTag) {
    if (!(taskTag instanceof TaskTag)) {
      throw new ValidationError(
        "Debe proporcionar una instancia válida de TaskTag",
        {
          entity: "Task",
          operation: "addTaskTag",
          expectedType: "TaskTag",
          actualType: taskTag ? taskTag.constructor.name : typeof taskTag,
        }
      );
    }

    if (
      this.#taskTags.length >=
      domainValidationConfig.RELATIONSHIPS.TASK_TAG.MAX_TAGS_PER_TASK
    ) {
      throw new ValidationError(
        `No se pueden asignar más de ${domainValidationConfig.RELATIONSHIPS.TASK_TAG.MAX_TAGS_PER_TASK} tags por tarea`,
        {
          entity: "Task",
          operation: "addTaskTag",
          currentCount: this.#taskTags.length,
          maxAllowed:
            domainValidationConfig.RELATIONSHIPS.TASK_TAG.MAX_TAGS_PER_TASK,
        }
      );
    }
    const existingTaskTag = this.#taskTags.find(
      (tt) => tt.tagId === taskTag.tagId
    );
    if (!existingTaskTag) {
      this.#taskTags.push(taskTag);
      this.#updatedAt = new Date();
    }
  }
  /**
   * Adds a tag to task by tag ID
   * @param {string|number} tagId - Tag identifier to associate
   */
  addTagById(tagId) {
    const validatedTagId = this.#validator.validateId(tagId, "Tag");
    const taskTag = TaskTag.createFromTagId({
      taskId: this.#id,
      tagId: validatedTagId,
    });
    this.addTaskTag(taskTag);
  }
  /**
   * Adds multiple tags to task by their IDs
   * @param {Array} tagIds - Array of tag identifiers
   * @throws {ValidationError} When total tags would exceed limit
   */
  addTagsByIds(tagIds = []) {
    if (!Array.isArray(tagIds)) {
      throw new InvalidFormatError("tagIds", "array", {
        entity: "Task",
        field: "tagIds",
        operation: "addTagsByIds",
      });
    }

    const totalAfterAdd = this.#taskTags.length + tagIds.length;
    if (
      totalAfterAdd >
      domainValidationConfig.RELATIONSHIPS.TASK_TAG.MAX_TAGS_PER_TASK
    ) {
      throw new ValidationError(
        `No se pueden asignar más de ${
          domainValidationConfig.RELATIONSHIPS.TASK_TAG.MAX_TAGS_PER_TASK
        } tags. Actual: ${this.#taskTags.length}, Intentando agregar: ${
          tagIds.length
        }`,
        {
          entity: "Task",
          operation: "addTagsByIds",
          currentCount: this.#taskTags.length,
          tryingToAdd: tagIds.length,
          maxAllowed:
            domainValidationConfig.RELATIONSHIPS.TASK_TAG.MAX_TAGS_PER_TASK,
        }
      );
    }

    tagIds.forEach((tagId) => this.addTagById(tagId));
  }

  /**
   * Replaces all task tags with new collection
   * @param {Array} newTaskTags - New task tags collection
   */
  setTaskTags(newTaskTags) {
    this.#taskTags = this.#validateTaskTags(newTaskTags);
    this.#updatedAt = new Date();
  }

  /**
   * Removes task tag association by ID
   * @param {string|number} taskTagId - Task tag identifier to remove
   */
  removeTaskTag(taskTagId) {
    const validatedId = this.#validator.validateId(taskTagId, "TaskTag");
    const initialLength = this.#taskTags.length;
    this.#taskTags = this.#taskTags.filter((tt) => tt.id !== validatedId);

    if (this.#taskTags.length !== initialLength) {
      this.#updatedAt = new Date();
    }
  }
  /**
   * Checks if task has specific tag
   * @param {string|number} tagId - Tag identifier to check
   * @returns {boolean} True if tag is associated
   */
  hasTag(tagId) {
    const validatedTagId = this.#validator.validateId(tagId, "Tag");
    return this.#taskTags.some((tt) => tt.tagId === validatedTagId);
  }
  /**
   * Checks if task can accept more tags
   * @returns {boolean} True if more tags can be added
   */
  canAddMoreTags() {
    return (
      this.#taskTags.length <
      domainValidationConfig.RELATIONSHIPS.TASK_TAG.MAX_TAGS_PER_TASK
    );
  }
  /**
   * Gets number of remaining available tag slots
   * @returns {number} Available tag slots count
   */
  getRemainingTagSlots() {
    return (
      domainValidationConfig.RELATIONSHIPS.TASK_TAG.MAX_TAGS_PER_TASK -
      this.#taskTags.length
    );
  }

  getNameMaxLength() {
    return this.#config.NAME.MAX_LENGTH;
  }

  getDescriptionMaxLength() {
    return this.#config.DESCRIPTION.MAX_LENGTH;
  }

  //Getters
  /**
   * Gets task unique identifier
   * @returns {string|number|null} Task ID
   */
  get id() {
    return this.#id;
  }

  /**
   * Gets task name
   * @returns {string} Task name
   */
  get name() {
    return this.#name;
  }
  /**
   * Gets task description
   * @returns {string} Task description
   */
  get description() {
    return this.#description;
  }
  /**
   * Gets scheduled date
   * @returns {Date|null} Scheduled date
   */
  get scheduledDate() {
    return this.#scheduledDate;
  }
  /**
   * Gets creation timestamp
   * @returns {Date} Creation date
   */
  get createdAt() {
    return this.#createdAt;
  }

  /**
   * Gets last update timestamp
   * @returns {Date} Update date
   */
  get updatedAt() {
    return this.#updatedAt;
  }
  /**
   * Gets completion status
   * @returns {boolean} True if task is completed
   */
  get isCompleted() {
    return this.#isCompleted;
  }
  /**
   * Gets overdue status
   * @returns {boolean} True if task is overdue
   */
  get isOverdue() {
    return this.isTaskOverdue();
  }

  /**
   * Gets user identifier
   * @returns {string|number} User ID
   */
  get userId() {
    return this.#userId;
  }
  /**
   * Gets priority level
   * @returns {number|null} Priority value
   */
  get priority() {
    return this.#priority;
  }

  /**
   * Gets task tags collection (defensive copy)
   * @returns {Array} Task tags
   */
  get taskTags() {
    return [...this.#taskTags];
  }

  /**
   * Gets associated tag objects from task tags
   * @returns {Array} Tag objects collection
   */
  getTags() {
    return this.#taskTags
      .map((taskTag) => taskTag.tag)
      .filter((tag) => tag !== undefined);
  }

  /**
   * Checks if task is overdue based on scheduled date
   * @returns {boolean} True if task is overdue and incomplete
   */
  isTaskOverdue() {
    if (!this.#scheduledDate) {
      return false;
    }

    const overdue =
      new Date() > new Date(this.#scheduledDate) && !this.#isCompleted;
    return overdue;
  }

  /**
   * Checks if task is scheduled for today
   * @returns {boolean} True if scheduled for current date
   */
  isScheduledForToday() {
    if (!this.#scheduledDate) return false;

    const today = new Date();
    const scheduled = new Date(this.#scheduledDate);

    return scheduled.toDateString() === today.toDateString();
  }

  /**
   * Converts task to plain object for serialization
   * @returns {Object} Task data as plain object
   */
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
      canAddMoreTags: this.canAddMoreTags(),
      remainingTagSlots: this.getRemainingTagSlots(),
      limits: {
        nameMaxLength: this.#config.NAME.MAX_LENGTH,
        descriptionMaxLength: this.#config.DESCRIPTION.MAX_LENGTH,
        priorityMin: this.#config.PRIORITY.MIN,
        priorityMax: this.#config.PRIORITY.MAX,
        maxTagsPerTask:
          domainValidationConfig.RELATIONSHIPS.TASK_TAG.MAX_TAGS_PER_TASK,
        minFutureMinutes: this.#config.SCHEDULED_DATE.MIN_FUTURE_MINUTES,
      },
    };
  }

  /**
   * Factory method to create a new task for creation scenarios
   * @static
   * @param {Object} taskData - Task creation data
   * @returns {Task} New task instance with full validation
   */
  static createNew({
    name,
    description = "",
    userId,
    scheduledDate = null,
    priority = null,
    taskTags = [],
  }) {
    return new Task({
      name,
      description,
      userId,
      scheduledDate,
      priority,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      taskTags: taskTags,
      skipValidations: false,
    });
  }

  /**
   * Factory method to create task for existing data scenarios
   * @static
   * @param {Object} data - Existing task data
   * @returns {Task} Task instance with validation skipping
   */
  static createExisting(data) {
    return new Task({
      ...data,
      skipValidations: true,
    });
  }
}

module.exports = Task;
