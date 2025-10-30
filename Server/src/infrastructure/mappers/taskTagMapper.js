/**
 * Mapper for TaskTag entity transformations between layers
 * @class TaskTagMapper
 */
class TaskTagMapper {
  /**
   * Creates a new TaskTagMapper instance
   * @param {Object} dependencies - Dependencies for TaskTagMapper
   * @param {class} dependencies.TaskTag - TaskTag domain class
   * @param {Object} dependencies.tagMapper - Tag mapper instance
   * @param {class} dependencies.TaskTagResponseDTO - TaskTag response DTO class
   * @param {class} dependencies.TaskTagRequestDTO - TaskTag request DTO class
   * @param {Object} dependencies.errorFactory - Error factory instance
   */
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

  /**
   * Converts TaskTag domain entity to response DTO
   * @param {TaskTag} taskTagDomain - TaskTag domain entity
   * @returns {TaskTagResponseDTO} TaskTag response DTO
   */
  domainToResponseDTO(taskTagDomain) {
    const tag = taskTagDomain.tag
      ? this.tagMapper.domainToResponse(taskTagDomain.tag)
      : null;
    return new this.TaskTagResponseDTO({
      id: taskTagDomain.id,
      taskId: taskTagDomain.taskId,
      createdAt: taskTagDomain.createdAt,
      tag,
    });
  }

  /**
   * Converts request data to TaskTag request DTO
   * @param {Object} requestData - Raw request data
   * @returns {TaskTagRequestDTO} TaskTag request DTO
   */
  requestDataToRequestDTO(requestData) {
    return new this.TaskTagRequestDTO({
      taskId: requestData.taskId ? requestData.taskId : null,
      tag: this.tagMapper.requestDataToCreateDTO(requestData.tag),
      toDelete: requestData.toDelete,
    });
  }

  /**
   * Converts TaskTag request DTO to domain entity
   * @param {TaskTagRequestDTO} tagRequestDTO - TaskTag request DTO
   * @returns {TaskTag} TaskTag domain entity
   */
  createRequestDTOToDomain(tagRequestDTO) {
    const tag = this.tagMapper.createRequestToDomain({
      id: tagRequestDTO.id || null,
      name: tagRequestDTO.name,
      description: tagRequestDTO.description || null,
    });

    const taskTag = this.TaskTag.create({
      tag,
    });
    return taskTag;
  }

  /**
   * Converts update TaskTag request DTO to domain entity
   * @param {TaskTagRequestDTO} tagRequestDTO - TaskTag request DTO
   * @returns {TaskTag} TaskTag domain entity
   */
  updateRequestDTOToDomain(tagRequestDTO) {
    return this.TaskTag.create({
      taskId: tagRequestDTO.taskId ? tagRequestDTO.taskId : null,
      tag: this.tagMapper.createRequestToDomain(tagRequestDTO.tag),
      toDelete: tagRequestDTO.toDelete || false,
    });
  }

  /**
   * Converts database row to TaskTag domain entity
   * @param {Object} row - Database row
   * @returns {TaskTag} TaskTag domain entity
   */
  dbToDomain(row) {
    let tag = null;
    if (row.tag.id && row.tag.name) {
      tag = this.tagMapper.dbToDomain(row.tag);
    }

    return new this.TaskTag({
      id: row.id,
      taskId: row.taskId,
      tagId: row.tagId,
      createdAt: row.createdAt,
      tag: tag,
      task: null,
    });
  }

  /**
   * Creates TaskTag domain entity from tag ID
   * @param {Object} params - Parameters object
   * @param {number} [params.taskId=null] - Task ID
   * @param {number} params.tagId - Tag ID
   * @returns {TaskTag} TaskTag domain entity
   */
  createFromTagId({ taskId = null, tagId }) {
    const taskTag = this.TaskTag.create({
      taskId,
      tagId,
    });
    return taskTag;
  }
}
module.exports = TaskTagMapper;
