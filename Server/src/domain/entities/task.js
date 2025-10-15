const DomainValidators = require("../utils/domainValidators");
const {
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
} = require("../errors/domainError");
const TaskTag = require("../entities/taskTag");
const domainValidationConfig = require("../config/domainValidationConfig");

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
    skipValidatios = false,
  }) {
    this.#validator = new DomainValidators();
    this.#config = domainValidationConfig.TASK;

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

  #validateName(name) {
    const validated = this.#validator.validateText(name, "name", {
      min: this.#config.NAME.MIN_LENGTH,
      max: this.#config.NAME.MAX_LENGTH,
      required: true,
      entity: "Task",
    });
    return validated;
  }

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
        required: false,
        max: this.#config.DESCRIPTION.MAX_LENGTH,
        entity: "Task",
      }
    );
    this.#updatedAt = new Date();
  }

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

  addTagById(tagId) {
    const validatedTagId = this.#validator.validateId(tagId, "Tag");
    const taskTag = TaskTag.createFromTagId({
      taskId: this.#id,
      tagId: validatedTagId,
    });
    this.addTaskTag(taskTag);
  }
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

  setTaskTags(newTaskTags) {
    this.#taskTags = this.#validateTaskTags(newTaskTags);
    this.#updatedAt = new Date();
  }

  removeTaskTag(taskTagId) {
    const validatedId = this.#validator.validateId(taskTagId, "TaskTag");
    const initialLength = this.#taskTags.length;
    this.#taskTags = this.#taskTags.filter((tt) => tt.id !== validatedId);

    if (this.#taskTags.length !== initialLength) {
      this.#updatedAt = new Date();
    }
  }

  hasTag(tagId) {
    const validatedTagId = this.#validator.validateId(tagId, "Tag");
    return this.#taskTags.some((tt) => tt.tagId === validatedTagId);
  }

  canAddMoreTags() {
    return (
      this.#taskTags.length <
      domainValidationConfig.RELATIONSHIPS.TASK_TAG.MAX_TAGS_PER_TASK
    );
  }

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
      skipValidatios: false
    });
  }

   static createExisting(data) {
    return new Task({
      ...data,
      skipValidations: true
    });
  }
}

module.exports = Task;
