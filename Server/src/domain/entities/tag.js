const {ValidationError} = require("../../utils/appErrors");
const errorCodes = require("../../utils/errorCodes");

class Tag {
  #id;
  #name;
  #description;
  #exists;
  #toDelete;
  #createdAt;
  #taskTags;
  #userTags;
  constructor({
    id = null,
    name,
    description = "",
    exists = false,
    toDelete = false,
    createdAt = new Date(),
    taskTags = [],
    userTags = [],
  }) {
    this.#id = id;
    this.#name = this.#validateName(name);
    this.#description = description;
    this.#exists = exists;
    this.#toDelete = toDelete;
    this.#createdAt =  createdAt instanceof Date ? createdAt : new Date(createdAt);
    this.#taskTags = taskTags;
    this.#userTags = userTags;
  }

  // bussiness logic
  markAsExisting() {
    this.#exists = true;
  }

  markForDeletion() {
    this.#toDelete = true;
  }

  unmarkForDeletion() {
    this.#toDelete = false;
  }

  updateName(newName) {
    this.#name = this.#validateName(newName);
  }

  updateDescription(newDescription) {
    this.#description = newDescription;
  }

  addTaskTag(taskTag) {
    if (!this.#taskTags.some((tt) => tt.id === taskTag.id)) {
      this.#taskTags.push(taskTag);
    }
  }

  removeTaskTag(taskTagId) {
    this.#taskTags = this.#taskTags.filter((tt) => tt.id !== taskTagId);
  }

  addUserTag(userTag) {
    if (!this.#userTags.some((ut) => ut.id === userTag.id)) {
      this.#userTags.push(userTag);
    }
  }

  removeUserTag(userTagId) {
    this.#userTags = this.#userTags.filter((ut) => ut.id !== userTagId);
  }

  // === VALIDACIONES ===
  #validateName(name) {
    if (!name || name.trim().length === 0) {
      throw ValidationError(
        "Tag name is required",
        null,
        errorCodes.REQUIRED_FIELD
      );
    }
    if (name.length > 50) {
      throw ValidationError(
        "Tag name cannot exceed 50 characters",
        { ActualLengthName: name.length },
        errorCodes.INVALID_FORMAT
      );
    }
    return name.trim();
  }

  validate() {
    const errors = [];

    if (!this.#name) {
      errors.push({ field: "name", message: "Tag name is required" });
    }

    if (errors.length > 0) {
      throw new ValidationError("Invalid tag data", errors);
    }
  }

  get id() {
    return this.#id;
  }
  get name() {
    return this.#name;
  }
  get description() {
    return this.#description;
  }
  get exists() {
    return this.#exists;
  }
  get toDelete() {
    return this.#toDelete;
  }
  get createdAt() {
    return this.#createdAt;
  }
  get taskTags() {
    return [...this.#taskTags];
  }
  get userTags() {
    return [...this.#userTags];
  }

  isAssignedToAnyTask() {
    return this.#taskTags.length > 0;
  }

  isAssignedToAnyUser() {
    return this.#userTags.length > 0;
  }

  canBeDeleted() {
    return !this.isAssignedToAnyTask() && !this.isAssignedToAnyUser();
  }

  toJSON() {
    return {
      id: this.#id,
      name: this.#name,
      description: this.#description,
      exists: this.#exists,
      toDelete: this.#toDelete,
      createdAt: this.#createdAt,
      taskTagsCount: this.#taskTags.length,
      userTagsCount: this.#userTags.length,
    };
  }

  static create({ name, description = "" }) {
    return new Tag({
      name,
      description,
      exists: true,
      toDelete: false,
      createdAt: new Date(),
    });
  }

  static fromDatabase(data) {
    return new Tag({
      id: data.id,
      name: data.name,
      description: data.description,
      exists: data.exists,
      toDelete: data.to_delete,
      createdAt: data.created_at,
      taskTags: data.task_tags || [],
      userTags: data.user_tags || [],
    });
  }
}

module.exports = Tag;
