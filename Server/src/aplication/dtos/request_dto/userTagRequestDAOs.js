class UserTagRequestDTO {
  constructor({ userId, tagId, toDelete }) {
    this.userId = userId;
    this.tagId = tagId;
    this.toDelete = toDelete || false;
  }
}

module.exports = UserTagRequestDTO;