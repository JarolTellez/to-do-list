class UserTagMapper {
  constructor(UserTag, tagMapper, UserTagResponseDTO, errorFactory) {
    this.UserTag = UserTag;
    this.tagMapper = tagMapper;
    this.UserTagResponseDTO = UserTagResponseDTO;
    this.errorFactory = errorFactory;
  }

  domainToResponse(userTagDomain) {
    return new this.UserTagResponseDTO({
      id: userTagDomain.id,
      userId: userTagDomain.userId,
      tagId: userTagDomain.tagId,
      createdAt: userTagDomain.createdAt,
      tag: userTagDomain.tag
        ? this.tagMapper.domainToResponse(userTagDomain.tag)
        : null,
    });
  }
  assignmentRequestToDomain(assignmentRequest) {
    return this.UserTag.create(
      {
        userId: assignmentRequest.userId,
        tagId: assignmentRequest.tagId,
      },
      this.errorFactory
    );
  }

  userTagAssignmentRequestToDomain(assignmentRequest) {
    return this.UserTag.create(
      {
        userId: assignmentRequest.userId,
        tagId: assignmentRequest.tagId,
      },
      this.errorFactory
    );
  }

  dbToDomain(row) {
    return new this.UserTag(
      {
        id: row.user_tag_id,
        userId: row.user_id,
        tagId: row.tag_id,
        createdAt: row.user_tag_created_at,
        tag: row.tag_id ? this.tagMapper.dbToDomain(row) : null,
      },
      this.errorFactory
    );
  }
}

module.exports = UserTagMapper;