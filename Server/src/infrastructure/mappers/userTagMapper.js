class UserTagMapper {
  constructor({
    UserTag,
    UserTagResponseDTO,
    UserTagRequestDTO,
    tagMapper,
    errorFactory
  }
  ) {
    this.UserTag = UserTag;
    this.UserTagResponseDTO = UserTagResponseDTO;
    this.UserTagRequestDTO = UserTagRequestDTO;
    this.tagMapper = tagMapper;
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

  requestDataToDTO(requestData) {
    return new this.UserTagRequestDTO({
      userId: requestData.userId,
      tagId: requestData.tagId,
      toDelete: requestData.toDelete || false,
    });
  }

  fromTagAndUserToDomain(tagId, userId){
     const userTag= this.UserTag.create(
          { userId, tagId }, 
          this.errorFactory
        );
        return userTag;

  }

  dbToDomain(row) {
    if (!row) return null;
    return new this.UserTag(
      {
        id: row.user_tag_id,
        userId: row.user_id,
        tagId: row.tag_id,
        createdAt: row.user_tag_created_at,
        tag: null,
        user: null, 
      },
      this.errorFactory
    );
  }

  dbToDomainWithRelations(row) {
     if (!row) return null;

    const tag = row.tag_id ? this.tagMapper.dbToDomain(row) : null;

    return new this.UserTag(
      {
        id: row.user_tag_id,
        userId: row.user_id,
        tagId: row.tag_id,
        createdAt: row.user_tag_created_at,
        tag: tag,
      },
      this.errorFactory
    );
  }
}

module.exports = UserTagMapper;
