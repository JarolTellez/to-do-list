const DomainValidators = require("../utils/domainValidators");
const {
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
} = require("../errors/domainError");
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
  }) {
    this.#validator = new DomainValidators();

    this.#id = this.#validator.validateId(id, "Task");
    this.#name = this.#validateName(name);
    this.#description = this.#validator.validateText(
      description,
      "description",
      {
        required: false,
        max: 1000,
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

    this.#validateBusinessRules();
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

    const date = this.#validator.validateDate(scheduledDate, "scheduledDate", {
      required: false,
      entity: "Task",
    });

    if (date < new Date()) {
      throw new ValidationError(
        "La fecha programada no puede estar en el pasado",
        {
          entity: "Task",
          field: "scheduledDate",
          value: date,
        }
      );
    }

    return date;
  }

  #validatePriority(priority) {
    if (priority === null || priority === undefined) return null;

    if (typeof priority !== "number" || priority < 1 || priority > 5) {
      throw new ValidationError("La prioridad debe ser un número entre 1 y 5", {
        entity: "Task",
        field: "priority",
        value: priority,
        min: 1,
        max: 5,
      });
    }

    return priority;
  }

  #validateBusinessRules() {
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
        max: 1000,
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
    }
  ) {
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
    });
  }
}

module.exports = Task;
