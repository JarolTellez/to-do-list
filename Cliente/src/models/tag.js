export class Tag {
  constructor({ id, name, description, createdAt }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.createdAt = new Date(createdAt);
  }

   validate() {
    const errors = [];

    if (!this.name || this.name.trim() === "") {
      errors.push({ field: "name", message: "El nombre de la etiqueta es obligatorio" });
    }

    if (this.name && this.name.length > 30) {
      errors.push({ field: "name", message: "El nombre no puede superar 30 caracteres" });
    }

    if (this.description && this.description.length > 200) {
      errors.push({ field: "description", message: "La descripción no puede superar 200 caracteres" });
    }

    if (errors.length > 0) {
      throw errors;
    }
  }

  
  toBadgeHTML() {
    return `<span class="tag-badge" data-tag-id="${
      this.id
    }">${this.getDisplayName()}</span>`;
  }
}
