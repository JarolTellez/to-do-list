class TagResponseDTO {
  constructor({
    id,
    name,
    description,
    createdAt,
    exists,
    taskTagsCount,
    userTagsCount,
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.createdAt = createdAt;
    this.exists = exists;
    this.taskTagsCount = taskTagsCount;
    this.userTagsCount = userTagsCount;
  }
}
