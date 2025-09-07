export class Tag {
  constructor(id = null, name, description, exists = false, toDelete=false, userId, taskTagId=null,) {
    this.id = id;
    this.name=name
    this.description = description;
    this.exists = exists;
    this.toDelete = toDelete;
    this.userId = userId;
    this.taskTagId = taskTagId;
  }

  validate() {
    const errors = [];

    if (!this.name || this.name.trim() === '') {
      errors.push({ field: 'name', message: 'El name de la etiqueta es obligatorio' });
    }

    if (!this.userId) {
      errors.push({ field: 'userId', message: 'Falta el ID del usuario' });
    }

    if (errors.length > 0) {
      throw errors;
    }
  }
}
