class TaskTagRequestDTO {
  constructor({ tagId, toDelete }) {
    this.tagId = tagId;
    this.toDelete = toDelete || false;
  }
}

module.exports =  TaskTagRequestDTO
