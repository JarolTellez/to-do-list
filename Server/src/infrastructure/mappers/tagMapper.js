class TagMapper {
  constructor(Tag, TagResponseDTO, errorFactory) {
    this.Tag = Tag;
    this.TagResponseDTO = TagResponseDTO;
    this.errorFactory = errorFactory;
  }

  domainToResponse(tagDomain) {
    return new this.TagResponseDTO({
      id: tagDomain.id,
      name: tagDomain.name,
      description: tagDomain.description,
      createdAt: tagDomain.createdAt,
      exists: tagDomain.exists,
      toDelete: tagDomain.toDelete,
      taskTagsCount: tagDomain.taskTags ? tagDomain.taskTags.length : 0,
      userTagsCount: tagDomain.userTags ? tagDomain.userTags.length : 0,
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
        name:
          updateTagRequest.name !== undefined
            ? updateTagRequest.name
            : existingTag.name,
        description:
          updateTagRequest.description !== undefined
            ? updateTagRequest.description
            : existingTag.description,
        exists: existingTag.exists,
        toDelete: existingTag.toDelete,
        createdAt: existingTag.createdAt,
        taskTags: existingTag.taskTags,
        userTags: existingTag.userTags,
      },
      this.errorFactory
    );
  }

  assignmentRequestToDomain(tagAssignmentRequest) {
    return new this.Tag(
      {
        id: tagAssignmentRequest.id || null,
        name: tagAssignmentRequest.name,
        description: tagAssignmentRequest.description || "",
        exists: tagAssignmentRequest.exists || false,
        toDelete: tagAssignmentRequest.toDelete || false,
      },
      this.errorFactory
    );
  }

  requestToDomain(tagRequest) {
    return new this.Tag(
      {
        id: tagRequest.id || null,
        name: tagRequest.name,
        description: tagRequest.description || null,
        exists: tagRequest.exists || false,
        toDelete: tagRequest.toDelete || false,
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
        toDelete: false,
      },
      this.errorFactory
    );
  }
}

module.exports = TagMapper;
