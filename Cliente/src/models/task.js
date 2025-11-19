/**
 * Task domain model
 * @class Task
 * @description Represents a task with scheduling, priority, and categorization
 */
export class Task {
  /**
   * Creates a new Task instance
   * @constructor
   * @param {Object} params - Task parameters
   * @param {string} params.id - Task identifier
   * @param {string} params.name - Task name
   * @param {string} params.description - Task description
   * @param {string} params.scheduledDate - Scheduled date and time
   * @param {string} params.createdAt - Creation timestamp
   * @param {string} params.updatedAt - Last update timestamp
   * @param {boolean} params.isCompleted - Completion status
   * @param {boolean} params.isOverdue - Overdue status
   * @param {string} params.userId - User identifier
   * @param {number} params.priority - Priority level (1-5)
   * @param {Array} params.tags - Associated tags
   */
  constructor({
    id,
    name,
    description,
    scheduledDate,
    createdAt,
    updatedAt,
    isCompleted = false,
    isOverdue = false,
    userId,
    priority,
    tags = [],
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
    this.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
    this.isCompleted = isCompleted;
    this.isOverdue = isOverdue;
    this.userId = userId;
    this.priority = priority;
    this.tags = tags;
  }

  /**
   * Validates task data
   * @function validate
   * @throws {Array} Array of validation errors
   */
  validate() {
    const errors = [];

    if (!this.name || this.name.trim() === "") {
      errors.push({
        field: "name",
        message: "El nombre de la tarea es obligatorio",
      });
    }

    if (this.name && this.name.length > 100) {
      errors.push({
        field: "name",
        message: "El nombre no puede superar 100 caracteres",
      });
    }

    if (this.description && this.description.length > 500) {
      errors.push({
        field: "description",
        message: "La descripción no puede superar 500 caracteres",
      });
    }

    if (this.scheduledDate && this.scheduledDate < new Date()) {
      errors.push({
        field: "scheduledDate",
        message: "La fecha programada no puede estar en el pasado",
      });
    }

    if (this.priority && (this.priority < 1 || this.priority > 5)) {
      errors.push({
        field: "priority",
        message: "La prioridad debe ser un número entre 1 y 5",
      });
    }

    if (errors.length > 0) {
      throw errors;
    }
  }

  /**
   * Gets priority name from numeric level
   * @function getPriorityName
   * @returns {string} Priority name
   */
  getPriorityName() {
    const priorityNames = {
      1: "Muy Baja",
      2: "Baja",
      3: "Media",
      4: "Alta",
      5: "Muy Alta",
    };
    return priorityNames[this.priority] || "Media";
  }

  /**
   * Validates task for creation
   * @function validateForCreation
   * @throws {Array} Array of validation errors
   */
  validateForCreation() {
    if (this.id) {
      throw [
        { field: "id", message: "El ID no debe estar presente en la creación" },
      ];
    }
    this.validate();
  }

  /**
   * Validates task for update
   * @function validateForUpdate
   * @throws {Array} Array of validation errors
   */
  validateForUpdate() {
    if (!this.id) {
      throw [{ field: "id", message: "El ID es obligatorio para actualizar" }];
    }
    this.validate();
  }

  /**
   * Checks if task is overdue
   * @function isOverdue
   * @returns {boolean} Whether task is overdue
   */
  isOverdue() {
    if (this.isCompleted || !this.scheduledDate) return false;
    return new Date() > this.scheduledDate;
  }
}
