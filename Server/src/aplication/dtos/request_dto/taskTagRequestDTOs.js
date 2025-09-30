class taskTagRequestDTO {
  constructor({ taskId=null, tag, toDelete }) {
    this.taskId = taskId;
    this.tag = tag;
    this.toDelete = toDelete || false;
  }
}

module.exports = taskTagRequestDTO;
