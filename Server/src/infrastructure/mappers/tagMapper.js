class TagMapper {
  constructor(
    Tag,
    TagResponseDTO,
    CreateTagRequestDTO,
    UpdateTagRequestDTO,
    errorFactory
  ) {
    this.Tag = Tag;
    this.TagResponseDTO = TagResponseDTO;
    this.CreateTagRequestDTO = CreateTagRequestDTO;
    this.UpdateTagRequestDTO = UpdateTagRequestDTO;
    this.errorFactory = errorFactory;
  }

  domainToResponse(tagDomain) {
    return new this.TagResponseDTO({
      id: tagDomain.id,
      name: tagDomain.name,
      description: tagDomain.description,
      createdAt: tagDomain.createdAt,
      exists: tagDomain.exists,
      taskTagsCount: tagDomain.taskTags ? tagDomain.taskTags.length : 0,
      userTagsCount: tagDomain.userTags ? tagDomain.userTags.length : 0,
    });
  }

  requestDataToCreateDTO(requestData) {
    return new this.CreateTagRequestDTO({
      name: requestData.name,
      description: requestData.description,
    });
  }

  requestDataToUpdateDTO(requestData) {
    return new this.UpdateTagRequestDTO({
      name: requestData.name,
      description: requestData.description,
    });
  }

  // Mapea row recibida de los request del cliente a entidad de dominio del backend
  createRequestToDomain(createTagRequest) {
    return this.Tag.create(
      {
        name: createTagRequest.name,
        description: createTagRequest.description,
      },
      this.errorFactory
    );
  }

  updateRequestToDomain(updateTagRequest, existingTag) {
    return new this.Tag(
      {
        id: existingTag.id,
        name: updateTagRequest.name ?? existingTag.name,
        description: updateTagRequest.description ?? existingTag.description,
        exists: existingTag.exists,
        createdAt: existingTag.createdAt,
        taskTags: existingTag.taskTags || [],
        userTags: existingTag.userTags || [],
      },
      this.errorFactory
    );
  }

  dbToDomain(row) {
    if (!row) return null;

    return new this.Tag(
      {
        id: row.tag_id,
        name: row.tag_name,
        description: row.tag_description,
        createdAt: row.tag_created_at,
        exists: true,
        taskTags: [],
        userTags: [],
      },
      this.errorFactory
    );
  }
}

module.exports = TagMapper;
