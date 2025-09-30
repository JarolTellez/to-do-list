class TaskMapper {
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
    this.TaskResponseDTO = TaskResponseDTO;
    this.CreateTaskRequestDTO = CreateTaskRequestDTO;
    this.UpdateTaskRequestDTO = UpdateTaskRequestDTO;
    this.CompleteTaskRequestDTO = CompleteTaskRequestDTO;
    this.TasksSummaryResponseDTO = TasksSummaryResponseDTO;
    this.errorFactory = errorFactory;
    this.dateParser = dateParser;
  }

  requestDataToCreateDTO(requestData) {
    return new this.CreateTaskRequestDTO({
      name: requestData.name,
      description: requestData.description,
      scheduledDate: requestData.scheduledDate,
      priority: requestData.priority,
      userId: requestData.userId,
      taskTags: requestData.taskTags.map((tt)=>this.taskTagMapper.requestDataToRequestDTO(tt))
    });
  }

  createDTOToDomain(createDTO) {
    return this.Task.create(
      {
        name: createDTO.name,
        description: createDTO.description,
        scheduledDate: createDTO.scheduledDate,
        priority: createDTO.priority,
        userId: createDTO.userId,
        taskTags: createDTO.taskTags.map((tt) =>this.taskTagMapper.requestDTOToDomain(tt)),
      },
      this.errorFactory
    );
  }

  requestDataToUpdateDTO(requestData) {
    return new this.UpdateTaskRequestDTO({
      name: requestData.name,
      description: requestData.description,
      scheduledDate: requestData.scheduledDate,
      priority: requestData.priority,
      taskTags: requestData.taskTags || [],
    });
  }

  updateDTOToDomain(updateDTO, existingTask) {
    const taskTags = (updateDTO.taskTags || []).map((tt) =>
      this.taskTagMapper.requestDTOToDomain(tt)
    );

    return new this.Task(
      {
        id: existingTask.id,
        name: updateDTO.name ?? existingTask.name,
        description: updateDTO.description ?? existingTask.description,
        scheduledDate: updateDTO.scheduledDate
          ? this.dateParser.parseToDate(updateDTO.scheduledDate)
          : existingTask.scheduledDate,
        priority: updateDTO.priority ?? existingTask.priority,
        isCompleted: existingTask.isCompleted,
        userId: existingTask.userId,
        createdAt: existingTask.createdAt,
        updatedAt: new Date(),
        taskTags: taskTags.length > 0 ? taskTags : existingTask.taskTags || [],
      },
      this.errorFactory
    );
  }

  requestDataToCompleteDTO(requestData) {
    return new this.CompleteTaskRequestDTO({
      isCompleted: requestData.isCompleted,
    });
  }

  completeDTOToDomain(completeDTO, existingTask) {
    return new this.Task(
      {
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
      },
      this.errorFactory
    );
  }

  dbToDomain(row) {
    return new this.Task(
      {
        id: row.task_id,
        name: row.task_name,
        description: row.task_description,
        scheduledDate: this.dateParser.fromMySQLDateTime(row.scheduled_date),
        createdAt:
          this.dateParser.fromMySQLDateTime(row.task_created_at) || new Date(),
        updatedAt:
          this.dateParser.fromMySQLDateTime(row.task_updated_at) || new Date(),
        isCompleted: row.is_completed,
        userId: row.user_id,
        priority: row.priority,
        taskTags: [],
      },
      this.errorFactory
    );
  }

  dbToDomainWithTags(rows, isSingle = false) {
    if (!rows || rows.length === 0) return isSingle ? null : [];

    const tasksMap = new Map();

    rows.forEach((row) => {
      let task = tasksMap.get(row.task_id);
      if (!task) {
        task = this.dbToDomain(row);
        tasksMap.set(row.task_id, task);
      }

      if (row.tag_id) {
        const taskTag = this.taskTagMapper.dbToDomain(row);
        task.addTaskTag
          ? task.addTaskTag(taskTag)
          : task.taskTags.push(taskTag);
      }
    });

    const result = Array.from(tasksMap.values());
    return isSingle ? result[0] || null : result;
  }
}

module.exports = TaskMapper;
