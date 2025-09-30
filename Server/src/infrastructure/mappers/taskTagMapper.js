class TaskTagMapper {
  constructor({TaskTag, tagMapper, TaskTagResponseDTO,  TaskTagRequestDTO, errorFactory}) {
    this.TaskTag = TaskTag;
    this.tagMapper = tagMapper;
    this.TaskTagResponseDTO = TaskTagResponseDTO;
    this.TaskTagRequestDTO = TaskTagRequestDTO;
    this.errorFactory = errorFactory;
  }

  domainToResponse(taskTagDomain) {
    return new this.TaskTagResponseDTO({
      id: taskTagDomain.id,
      taskId: taskTagDomain.taskId,
      tagId: taskTagDomain.tagId,
      createdAt: taskTagDomain.createdAt,
      tag: taskTagDomain.tag
        ? this.tagMapper.domainToResponse(taskTagDomain.tag)
        : null,
    });
  }

   requestDataToRequestDTO(requestData) {
    return new this.TaskTagRequestDTO({
      taskId: requestData.taskId?requestData.taskId:null,
      tag:this.tagMapper.requestDataToCreateDTO(requestData.tag),
      toDelete: requestData.toDelete,
    });
  }

  requestDTOToDomain(taskTagRequestDTO) {
   return this.TaskTag.create(
      {
        taskId: taskTagRequestDTO.taskId? taskTagRequestDTO.taskId:null,
        tag: this.tagMapper.createRequestToDomain(taskTagRequestDTO.tag),
        toDelete: taskTagRequestDTO.toDelete || false,
      },
      this.errorFactory
    );
  }


  dbToDomain(row) {
     let tag = null;
    if (row.tag_id && row.tag_name) {
      tag = this.tagMapper.dbToDomain(row); 
    }

    return new this.TaskTag(
      {
        id: row.task_tag_id,
        taskId: row.task_id,
        tagId: row.tag_id,
        createdAt: row.task_tag_created_at,
        tag: tag,
        task: null, 
      },
      this.errorFactory
    );
  }
}
module.exports = TaskTagMapper;
