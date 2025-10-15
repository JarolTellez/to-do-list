/**
 * Mapper for Task entity transformations between layers
 * @class TaskMapper
 */
class TaskMapper {
  /**
   * Creates a new TaskMapper instance
   * @param {Object} dependencies - Dependencies for TaskMapper
   * @param {class} dependencies.Task - Task domain class
   * @param {Object} dependencies.tagMapper - Tag mapper instance
   * @param {Object} dependencies.taskTagMapper - TaskTag mapper instance
   * @param {class} dependencies.TaskResponseDTO - Task response DTO class
   * @param {class} dependencies.CreateTaskRequestDTO - Create task request DTO class
   * @param {class} dependencies.UpdateTaskRequestDTO - Update task request DTO class
   * @param {class} dependencies.CompleteTaskRequestDTO - Complete task request DTO class
   * @param {class} dependencies.TasksSummaryResponseDTO - Tasks summary response DTO class
   * @param {Object} dependencies.errorFactory - Error factory instance
   * @param {Object} dependencies.dateParser - Date parser utility
   */
  constructor({
    Task,
    tagMapper,
    taskTagMapper,
    TaskResponseDTO,
    CreateTaskRequestDTO,
    UpdateTaskRequestDTO,
    CompleteTaskRequestDTO,
    TasksSummaryResponseDTO,
    errorFactory,
    dateParser,
  }) {
    this.Task = Task;
    this.tagMapper = tagMapper;
    this.taskTagMapper = taskTagMapper;
    this.tagMapper = tagMapper;
    this.TaskResponseDTO = TaskResponseDTO;
    this.CreateTaskRequestDTO = CreateTaskRequestDTO;
    this.UpdateTaskRequestDTO = UpdateTaskRequestDTO;
    this.CompleteTaskRequestDTO = CompleteTaskRequestDTO;
    this.TasksSummaryResponseDTO = TasksSummaryResponseDTO;
    this.errorFactory = errorFactory;
    this.dateParser = dateParser;
  }

  /**
   * Converts request data to create task DTO
   * @param {Object} requestData - Raw request data
   * @returns {CreateTaskRequestDTO} Create task request DTO
   */
  requestDataToCreateDTO(requestData) {
    const tags = requestData.tags
      .filter((tag) => tag && tag.name && typeof tag.name === "string")
      .map((t) => this.tagMapper.requestDataToCreateRequestDTO(t));

    return new this.CreateTaskRequestDTO({
      name: requestData.name,
      description: requestData.description,
      scheduledDate: requestData.scheduledDate,
      priority: requestData.priority,
      userId: requestData.userId,
      tags,
    });
  }

  /**
   * Converts create task request DTO to Task domain entity
   * @param {CreateTaskRequestDTO} createDTO - Create task request DTO
   * @returns {Task} Task domain entity
   */
  createRequestDTOToDomain(createDTO) {
    const taskTags = createDTO.tags.map((tt) =>
      this.taskTagMapper.createRequestDTOToDomain(tt)
    );
    return this.Task.createNew({
      name: createDTO.name,
      description: createDTO.description,
      scheduledDate: createDTO.scheduledDate
        ? this.dateParser.parseToDate(createDTO.scheduledDate)
        : null,
      priority: createDTO.priority,
      userId: createDTO.userId,
      taskTags,
    });
  }

  /**
   * Converts request data to update task DTO
   * @param {Object} requestData - Raw request data
   * @returns {UpdateTaskRequestDTO} Update task request DTO
   */
  requestDataToUpdateDTO(requestData) {
    const tags = requestData.tags
      .filter((tag) => tag && tag.name && typeof tag.name === "string")
      .map((t) => this.tagMapper.requestDataToCreateRequestDTO(t));

    return new this.UpdateTaskRequestDTO({
      id: requestData.id,
      name: requestData.name,
      description: requestData.description,
      scheduledDate: requestData.scheduledDate,
      priority: requestData.priority,
      userId: requestData.userId,
      tags,
    });
  }

  /**
   * Converts update task request DTO to Task domain entity
   * @param {UpdateTaskRequestDTO} updateDTO - Update task request DTO
   * @param {Task} existingTask - Existing task domain entity
   * @returns {Task} Updated Task domain entity
   */
  updateDTOToDomain(updateDTO, existingTask) {
    const taskTags = (updateDTO.tags || []).map((tt) =>
      this.taskTagMapper.createRequestDTOToDomain(tt)
    );

    return new this.Task({
      id: existingTask.id,
      name: updateDTO.name,
      description: updateDTO.description,
      scheduledDate: updateDTO.scheduledDate
        ? this.dateParser.parseToDate(updateDTO.scheduledDate)
        : null,
      priority: updateDTO.priority,
      isCompleted: existingTask.isCompleted,
      userId: existingTask.userId,
      createdAt: existingTask.createdAt,
      updatedAt: new Date(),
      taskTags,
    });
  }

  /**
   * Converts request data to complete task DTO
   * @param {Object} requestData - Raw request data
   * @returns {CompleteTaskRequestDTO} Complete task request DTO
   */
  requestDataToCompleteDTO(requestData) {
    return new this.CompleteTaskRequestDTO({
      isCompleted: requestData.isCompleted,
    });
  }

  /**
   * Converts complete task request DTO to Task domain entity
   * @param {CompleteTaskRequestDTO} completeDTO - Complete task request DTO
   * @param {Task} existingTask - Existing task domain entity
   * @returns {Task} Completed Task domain entity
   */
  completeDTOToDomain(completeDTO, existingTask) {
    return new this.Task({
      id: existingTask.id,
      name: existingTask.name,
      description: existingTask.description,
      scheduledDate: existingTask.scheduledDate,
      priority: existingTask.priority,
      isCompleted: completeDTO.isCompleted,
      userId: existingTask.userId,
      createdAt: existingTask.createdAt,
      updatedAt: new Date(),
      taskTags: existingTask.taskTags || [],
    });
  }

  /**
   * Converts database row to Task domain entity
   * @param {Object} row - Database row
   * @returns {Task} Task domain entity
   */
  dbToDomain(row) {
    return  this.Task.createExisting({
      id: row.id,
      name: row.name,
      description: row.description,
      scheduledDate: this.dateParser.fromMySQLDateTime(row.scheduledDate),
      createdAt: this.dateParser.fromMySQLDateTime(row.createdAt) || new Date(),
      updatedAt: this.dateParser.fromMySQLDateTime(row.updatedAt) || new Date(),
      isCompleted: row.isCompleted,
      userId: row.userId,
      priority: row.priority,
      taskTags: [],
    });
  }

  /**
   * Converts database row with tags to Task domain entity
   * @param {Object} dbTask - Database task with tags
   * @returns {Task|null} Task domain entity with tags or null
   */
  dbToDomainWithTags(dbTask) {
    if (!dbTask) return null;
    const taskTags = [];
    if (dbTask.taskTags && Array.isArray(dbTask.taskTags)) {
      dbTask.taskTags.forEach((taskTagData) => {
        if (taskTagData && taskTagData.id) {
          const taskTag = this.taskTagMapper.dbToDomain(taskTagData);
          taskTags.push(taskTag);
        }
      });
    }

    return this.Task.createExisting({
      id: dbTask.id,
      name: dbTask.name,
      description: dbTask.description,
      scheduledDate: this.dateParser.fromMySQLDateTime(dbTask.scheduledDate),
      createdAt:
        this.dateParser.fromMySQLDateTime(dbTask.createdAt) || new Date(),
      updatedAt:
        this.dateParser.fromMySQLDateTime(dbTask.updatedAt) || new Date(),
      isCompleted: dbTask.isCompleted,
      userId: dbTask.userId,
      priority: dbTask.priority,
      taskTags: taskTags,
    });
  }

  /**
   * Converts Task domain entity to response DTO
   * @param {Task} taskDomain - Task domain entity
   * @returns {TaskResponseDTO} Task response DTO
   */
  domainToResponseDTO(taskDomain) {
    const domainTaskTags = taskDomain.taskTags;
    const taskTags = domainTaskTags
      ? domainTaskTags.map((taskTag) =>
          this.taskTagMapper.domainToResponseDTO(taskTag)
        )
      : [];
    return new this.TaskResponseDTO({
      id: taskDomain.id,
      name: taskDomain.name,
      description: taskDomain.description,
      scheduledDate: taskDomain.scheduledDate,
      createdAt: taskDomain.createdAt,
      updatedAt: taskDomain.updatedAt,
      isCompleted: taskDomain.isCompleted,
      userId: taskDomain.userId,
      priority: taskDomain.priority,
      taskTags,
    });
  }
}

module.exports = TaskMapper;
