class TagMapper {
  constructor({ Tag, TagResponseDTO, TagRequestDTO, errorFactory }) {
    this.Tag = Tag;
    this.TagResponseDTO = TagResponseDTO;
    this.TagRequestDTO = TagRequestDTO;
    this.errorFactory = errorFactory;
  }

  domainToResponse(tagDomain) {
    return new this.TagResponseDTO({
      id: tagDomain.id,
      name: tagDomain.name,
      description: tagDomain.description,
      createdAt: tagDomain.createdAt,
    });
  }

  requestDataToCreateRequestDTO(requestData) {
    return new this.TagRequestDTO({
      id: requestData.id ? requestData.id : null,
      name: requestData.name,
      description: requestData.description,
    });
  }

  createRequestToDomain(createTagRequest) {
    return this.Tag.create(
      {
        id: createTagRequest.id,
        name: createTagRequest.name,
        description: createTagRequest.description
          ? createTagRequest.description
          : null,
      }
    );
  }

  requestToDomain(updateTagRequest, existingTag) {
    return new this.Tag(
      {
        id: existingTag.id,
        name: updateTagRequest.name ?? existingTag.name,
        description: updateTagRequest.description ?? existingTag.description,
        exists: existingTag.exists,
        createdAt: existingTag.createdAt,
        taskTags: existingTag.taskTags,
        userTags: existingTag.userTags,
      }
    );
  }

  dbToDomain(row) {
    if (!row) return null;

    return new this.Tag(
      {
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.createdAt,
        exists: true,
        taskTags: [],
        userTags: [],
      }
    );
  }
}

module.exports = TagMapper;
