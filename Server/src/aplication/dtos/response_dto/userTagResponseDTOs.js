class UserTagResponseDTO {
  constructor({ id, userId, tagId, createdAt, tag }) {
    this.id = id;
    this.userId = userId;
    this.tagId = tagId;
    this.createdAt = createdAt;
    this.tag = tag;
  }
}

module.exports = UserTagResponseDTO;