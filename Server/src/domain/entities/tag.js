const DomainValidators = require("../utils/domainValidators");

class Tag {
  #id;
  #name;
  #description;
  #exists;
  #createdAt;
  #taskTags;
  #userTags;
  #validator;
  constructor(
    {
      id = null,
      name,
      description = "",
      exists = false,
      createdAt = new Date(),
      taskTags = [],
      userTags = [],
    },
    errorFactory
  ) {
    this.#validator = new DomainValidators(errorFactory);
    this.#id = this.#validator.validateId(id, "Tag");
    this.#name = this.#validateName(name);
    this.#description = this.#validator.validateText(
      description,
      "description",
      {
        max: 500,
        entity: "Tag",
      }
    );
    this.#exists = this.#validator.validateBoolean(exists, "exists", "Tag");
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt");
    this.#taskTags = this.#validator.validateCollection(taskTags, "taskTags");
    this.#userTags = this.#validator.validateCollection(userTags, "userTags");
  }
  #validateName(name) {
    return this.#validator.validateText(name, "name", {
      min: 1,
      max: 50,
      required: true,
      entity: "Tag",
    });
  }

  // bussiness logic
  markAsExisting() {
    this.#exists = true;
  }

  updateName(newName) {
    this.#name = this.#validateName(newName);
  }

  updateDescription(newDescription) {
    this.#description = this.#validator.validateText(
      newDescription,
      "description",
      {
        max: 500,
        entity: "Tag",
      }
    );
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

  // Getters
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
      createdAt: this.#createdAt,
      taskTagsCount: this.#taskTags.length,
      userTagsCount: this.#userTags.length,
    };
  }

  static create({ name, description = "" }, errorFactory) {
    return new Tag(
      {
        name,
        description,
        exists: true,
        createdAt: new Date(),
      },
      errorFactory
    );
  }

}

module.exports = Tag;
