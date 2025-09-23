class TaskTagMapper {
  constructor(TaskTag, tagMapper, TaskTagResponseDTO, errorFactory) {
    this.TaskTag = TaskTag;
    this.tagMapper = tagMapper;
    this.TaskTagResponseDTO = TaskTagResponseDTO;
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

  assignmentRequestToDomain(assignmentRequest) {
    return this.TaskTag.create(
      {
        taskId: assignmentRequest.taskId,
        tagId: assignmentRequest.tagId,
      },
      this.errorFactory
    );
  }

  taskTagAssignmentRequestToDomain(assignmentRequest) {
    return this.TaskTag.create(
      {
        taskId: assignmentRequest.taskId,
        tagId: assignmentRequest.tagId,
      },
      this.errorFactory
    );
  }

  dbToDomain(row) {
    return new this.TaskTag(
      {
        id: row.task_tag_id,
        taskId: row.task_id,
        tagId: row.tag_id,
        createdAt: row.task_tag_created_at,
        tag: row.tag_id ? this.tagMapper.dbToDomain(row) : null,
      },
      this.errorFactory
    );
  }
}
module.exports = TaskTagMapper;
