class TaskTagResponseDTO {
  constructor({ id, taskId, tagId, createdAt, tag }) {
    this.id = id;
    this.taskId = taskId;
    this.tagId = tagId;
    this.createdAt = createdAt;
    this.tag = tag;  //TagResponseDTO
  }
}

module.exports = TaskTagResponseDTO;