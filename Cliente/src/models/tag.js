/**
 * Tag domain model
 * @class Tag
 * @description Represents a categorization tag for tasks
 */
export class Tag {
  /**
   * Creates a new Tag instance
   * @constructor
   * @param {Object} params - Tag parameters
   * @param {string} params.id - Tag identifier
   * @param {string} params.name - Tag name
   * @param {string} params.description - Tag description
   * @param {string} params.createdAt - Tag creation timestamp
   */
  constructor({ id, name, description, createdAt }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.createdAt = new Date(createdAt);
  }

  /**
   * Validates tag data
   * @function validate
   * @throws {Array} Array of validation errors
   */
  validate() {
    const errors = [];

    if (!this.name || this.name.trim() === "") {
      errors.push({
        field: "name",
        message: "El nombre de la etiqueta es obligatorio",
      });
    }

    if (this.name && this.name.length > 30) {
      errors.push({
        field: "name",
        message: "El nombre no puede superar 30 caracteres",
      });
    }

    if (this.description && this.description.length > 200) {
      errors.push({
        field: "description",
        message: "La descripción no puede superar 200 caracteres",
      });
    }

    if (errors.length > 0) {
      throw errors;
    }
  }

  /**
   * Generates HTML badge representation
   * @function toBadgeHTML
   * @returns {string} HTML string for tag badge
   */
  toBadgeHTML() {
    return `<span class="tag-badge" data-tag-id="${
      this.id
    }">${this.getDisplayName()}</span>`;
  }
}
