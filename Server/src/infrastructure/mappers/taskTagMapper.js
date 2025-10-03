class TaskTagMapper {
  constructor({
    TaskTag,
    tagMapper,
    TaskTagResponseDTO,
    TaskTagRequestDTO,
    errorFactory,
  }) {
    this.TaskTag = TaskTag;
    this.tagMapper = tagMapper;
    this.TaskTagResponseDTO = TaskTagResponseDTO;
    this.TaskTagRequestDTO = TaskTagRequestDTO;
    this.errorFactory = errorFactory;
  }

  domainToResponseDTO(taskTagDomain) {
    const tag=taskTagDomain.tag
        ? this.tagMapper.domainToResponse(taskTagDomain.tag)
        : null;
    return new this.TaskTagResponseDTO({
      id: taskTagDomain.id,
      taskId: taskTagDomain.taskId,
      createdAt: taskTagDomain.createdAt,
      tag
    });
  }

  requestDataToRequestDTO(requestData) {
    return new this.TaskTagRequestDTO({
      taskId: requestData.taskId ? requestData.taskId : null,
      tag: this.tagMapper.requestDataToCreateDTO(requestData.tag),
      toDelete: requestData.toDelete,
    });
  }

  createRequestDTOToDomain(tagRequestDTO) {
    if (!tagRequestDTO.name) {
      throw this.errorFactory.createValidationError("Tag name is required");
    }

    const tag = this.tagMapper.createRequestToDomain({
      id: tagRequestDTO.id || null,
      name: tagRequestDTO.name,
      description: tagRequestDTO.description || null,
    });

    const taskTag = this.TaskTag.create(
      {
        tag,
      },
      this.errorFactory
    );
    return taskTag;
  }

  updateRequestDTOToDomain(tagRequestDTO) {
    return this.TaskTag.create(
      {
        taskId: tagRequestDTO.taskId ? tagRequestDTO.taskId : null,
        tag: this.tagMapper.createRequestToDomain(tagRequestDTO.tag),
        toDelete: tagRequestDTO.toDelete || false,
      },
      this.errorFactory
    );
  }

  dbToDomain(row) {
  
    let tag = null;
    if (row.tag.id && row.tag.name) {
      tag = this.tagMapper.dbToDomain(row.tag);
    }

    return new this.TaskTag(
      {
        id: row.id,
        taskId: row.taskId,
        tagId: row.tagId,
        createdAt: row.createdAt,
        tag: tag,
        task: null,
      },
      this.errorFactory
    );
  }

createFromTagId({ taskId = null, tagId }, errorFactory) {
  const taskTag = this.TaskTag.create(
    { 
      taskId, 
      tagId 
    },
    errorFactory
  );
  return taskTag;
}
}
module.exports = TaskTagMapper;
