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
    this.tagMapper = tagMapper;
    this.TaskResponseDTO = TaskResponseDTO;
    this.CreateTaskRequestDTO = CreateTaskRequestDTO;
    this.UpdateTaskRequestDTO = UpdateTaskRequestDTO;
    this.CompleteTaskRequestDTO = CompleteTaskRequestDTO;
    this.TasksSummaryResponseDTO = TasksSummaryResponseDTO;
    this.errorFactory = errorFactory;
    this.dateParser = dateParser;
  }

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

  createRequestDTOToDomain(createDTO) {
    const taskTags = createDTO.tags.map((tt) =>
      this.taskTagMapper.createRequestDTOToDomain(tt)
    );
    return this.Task.create(
      {
        name: createDTO.name,
        description: createDTO.description,
        scheduledDate: createDTO.scheduledDate
          ? this.dateParser.parseToDate(createDTO.scheduledDate)
          : existingTask.scheduledDate,
        priority: createDTO.priority,
        userId: createDTO.userId,
        taskTags,
      },
      this.errorFactory
    );
  }

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

  updateDTOToDomain(updateDTO, existingTask) {
    const taskTags = (updateDTO.tags || []).map((tt) =>
      this.taskTagMapper.createRequestDTOToDomain(tt)
    );

    return new this.Task(
      {
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
        id: row.id,
        name: row.name,
        description: row.description,
        scheduledDate: this.dateParser.fromMySQLDateTime(row.scheduledDate),
        createdAt:
          this.dateParser.fromMySQLDateTime(row.createdAt) || new Date(),
        updatedAt:
          this.dateParser.fromMySQLDateTime(row.updatedAt) || new Date(),
        isCompleted: row.isCompleted,
        userId: row.userId,
        priority: row.priority,
        taskTags: [],
      },
      this.errorFactory
    );
  }

  // dbToDomainWithTags(dbTask) {
  //   if (!dbTask) return null;

  //   const task = this.dbToDomain(dbTask);

  //   if (dbTask.taskTags && Array.isArray(dbTask.taskTags)) {
  //     dbTask.taskTags.forEach((taskTagData, index) => {
  //       if (taskTagData && taskTagData.id) {
  //         const taskTag = this.taskTagMapper.dbToDomain(taskTagData);
  //         console.log("TASK TAG A AGREGAR: ", taskTag.toJSON());
  //         task.addTaskTag(taskTag);
  //       }
  //     });
  //   }

  //   return task;
  // }

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

  return new this.Task(
    {
      id: dbTask.id,
      name: dbTask.name,
      description: dbTask.description,
      scheduledDate: this.dateParser.fromMySQLDateTime(dbTask.scheduledDate),
      createdAt: this.dateParser.fromMySQLDateTime(dbTask.createdAt) || new Date(),
      updatedAt: this.dateParser.fromMySQLDateTime(dbTask.updatedAt) || new Date(),
      isCompleted: dbTask.isCompleted,
      userId: dbTask.userId,
      priority: dbTask.priority,
      taskTags: taskTags,  
    },
    this.errorFactory
  );
}

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
