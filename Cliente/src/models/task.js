class Task {
  constructor({
    id,
    name,
    description,
    scheduledDate,
    createdAt,
    updatedAt,
    isCompleted = false,
    userId,
    priority,
    taskTags = [],
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
    this.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
    this.isCompleted = isCompleted;
    this.userId = userId;
    this.priority = priority;
    this.taskTags = taskTags.map((tag) => new TaskTag(tag));
  }

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

    if (!this.userId) {
      errors.push({
        field: "userId",
        message: "El ID del usuario es obligatorio",
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

  validateForCreation() {
    if (this.id) {
      throw [
        { field: "id", message: "El ID no debe estar presente en la creación" },
      ];
    }
    this.validate();
  }

  validateForUpdate() {
    if (!this.id) {
      throw [{ field: "id", message: "El ID es obligatorio para actualizar" }];
    }
    this.validate();
  }

  isOverdue() {
    if (this.isCompleted || !this.scheduledDate) return false;
    return new Date() > this.scheduledDate;
  }
}
