export class Task {
  constructor(
    id = null,
    name,
    description,
    scheduledDate = null,
    createdAt = null,
    updatedAt = null,
    isCompleted = false,
    userId,
    priority = null,
    tags = []
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    this.createdAt = createdAt ? new Date(createdAt) : null;
    this.updatedAt = updatedAt ? new Date(updatedAt) : null;
    this.isCompleted = isCompleted;
    this.userId = userId;
    this.priority = priority;
    this.tags = tags;
  }

  validate() {
    const errors = [];

    if (!this.name || this.name.trim() === '') {
      errors.push({ field:'name', message: 'El name es obligatorio' });
    }

    if (this.name && this.name.length > 50) {
      errors.push({ field:'name', message: 'El name no puede superar 50 caracteres' });
    }

    if (this.description && this.description.length > 255) {
      errors.push({ field:'description', message: 'La descripción no puede superar 255 caracteres' });
    }

    if (!this.userId) {
      errors.push({ field:'userId', message: 'El ID del usuario es obligatorio' });
    }

    if (this.scheduledDate && this.scheduledDate < new Date()) {
      errors.push({ field:'scheduledDate', message: 'La fecha no puede estar en el pasado' });
    }

    if (errors.length > 0) {
      throw errors;
    }
  }

    toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      scheduledDate: this.scheduledDate,
      updatedAt: this.updatedAt,
      isCompleted: this.isCompleted,
      userId: this.userId,
      priority: this.priority,
      tags: this.tags,
    };
  }
}
