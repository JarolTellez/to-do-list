const DomainValidators = require("../utils/domainValidators");
const {
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
} = require("../errors/domainError");
const domainValidationConfig = require("../config/domainValidationConfig");

class Tag {
  #id;
  #name;
  #description;
  #createdAt;
  #taskTags;
  #userTags;
  #validator;
  #config;

  constructor({
    id = null,
    name,
    description = "",
    createdAt = new Date(),
    taskTags = [],
    userTags = [],
  }) {
    this.#validator = new DomainValidators();
    this.#config = domainValidationConfig.TAG;

    this.#id = this.#validator.validateId(id, "Tag");
    this.#name = this.#validateName(name);
    this.#description = this.#validator.validateText(
      description,
      "description",
      {
        required: false,
        max: this.#config.DESCRIPTION.MAX_LENGTH,
        entity: "Tag",
      }
    );
    this.#createdAt = this.#validator.validateDate(createdAt, "createdAt", {
      required: true,
      entity: "Tag",
    });
    this.#taskTags = this.#validator.validateCollection(taskTags, "taskTags");
    this.#userTags = this.#validator.validateCollection(userTags, "userTags");
  }

  #validateName(name) {
    return this.#validator.validateText(name, "name", {
      min: this.#config.NAME.MIN_LENGTH,
      max: this.#config.NAME.MAX_LENGTH,
      required: true,
      entity: "Tag",
    });
  }

  // bussiness logic

  updateName(newName) {
    this.#name = this.#validateName(newName);
  }

  updateDescription(newDescription) {
    this.#description = this.#validator.validateText(
      newDescription,
      "description",
      {
        required: false,
        max: this.#config.DESCRIPTION.MAX_LENGTH,
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

  getNameMaxLength() {
    return this.#config.NAME.MAX_LENGTH;
  }

  getDescriptionMaxLength() {
    return this.#config.DESCRIPTION.MAX_LENGTH;
  }

  getUsageLimits() {
    return {
      maxTagsPerUser:
        domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER,
      maxTagsPerTask:
        domainValidationConfig.RELATIONSHIPS.TASK_TAG.MAX_TAGS_PER_TASK,
    };
  }

  toJSON() {
    return {
      id: this.#id,
      name: this.#name,
      description: this.#description,
      createdAt: this.#createdAt.toISOString(),
      taskTagsCount: this.#taskTags.length,
      userTagsCount: this.#userTags.length,
      canBeDeleted: this.canBeDeleted(),
      limits: {
        nameMaxLength: this.#config.NAME.MAX_LENGTH,
        descriptionMaxLength: this.#config.DESCRIPTION.MAX_LENGTH,
        maxTagsPerUser:
          domainValidationConfig.RELATIONSHIPS.USER_TAG.MAX_TAGS_PER_USER,
        maxTagsPerTask:
          domainValidationConfig.RELATIONSHIPS.TASK_TAG.MAX_TAGS_PER_TASK,
      },
    };
  }

  static create({ id = null, name, description = "" }) {
    return new Tag({
      id,
      name,
      description,
      createdAt: new Date(),
    });
  }
}

module.exports = Tag;
