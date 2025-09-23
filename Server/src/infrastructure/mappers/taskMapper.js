class TaskMapper {
  constructor(
    Task,
    tagMapper,
    taskTagMapper,
    TaskResponseDTO,
    TaskDetailResponseDTO,
    TasksSummaryResponseDTO,
    errorFactory,
    dateParser
  ) {
    this.Task = Task;
    this.tagMapper = tagMapper;
    this.taskTagMapper = taskTagMapper;
    this.TaskResponseDTO = TaskResponseDTO;
    this.TaskDetailResponseDTO = TaskDetailResponseDTO;
    this.TasksSummaryResponseDTO = TasksSummaryResponseDTO;
    this.errorFactory = errorFactory;
    this.dateParser = dateParser;
  }

  domainToResponse(taskDomain) {
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
      taskTags: (taskDomain.taskTags || []).map((tt) =>
        this.taskTagMapper.domainToResponse(tt)
      ),
    });
  }

  domainToDetailResponse(taskDomain) {
    return new this.TaskDetailResponseDTO({
      task: this.domainToResponse(taskDomain),
      tags: (taskDomain.taskTags || []).map((tt) =>
        this.taskTagMapper.domainToResponse(tt)
      ),
    });
  }

  toTasksSummary(pending, completed, overdue) {
    return new this.TasksSummaryResponseDTO({
      pending,
      completed,
      overdue,
      total: pending + completed + overdue,
    });
  }

  createRequestToDomain(createTaskRequest) {
    const taskTags = (createTaskRequest.taskTags || []).map((taskTag) =>
      this.taskTagMapper.requestToDomain({
        ...taskTag,
      })
    );

    return this.Task.create(
      {
        name: createTaskRequest.name,
        description: createTaskRequest.description,
        scheduledDate: createTaskRequest.scheduledDate,
        priority: createTaskRequest.priority,
        userId: createTaskRequest.userId,
        taskTags,
      },
      this.errorFactory
    );
  }

  updateRequestToDomain(updateTaskRequestDTO, existingTask) {
    const taskTags = (updateTaskRequestDTO.taskTags || []).map((taskTag) =>
      this.taskTagMapper.requestToDomain({
        ...taskTag,
      })
    );

    return new this.Task(
      {
        id: existingTask.id,
        name: updateTaskRequestDTO.name ?? existingTask.name,
        description:
          updateTaskRequestDTO.description ?? existingTask.description,
        scheduledDate: updateTaskRequestDTO.scheduledDate
          ? this.dateParser.parseToDate(updateTaskRequestDTO.scheduledDate)
          : existingTask.scheduledDate,
        priority: updateTaskRequestDTO.priority ?? existingTask.priority,
        isCompleted:
          updateTaskRequestDTO.isCompleted ?? existingTask.isCompleted,
        userId: existingTask.userId,
        createdAt: existingTask.createdAt,
        updatedAt: new Date(),
        taskTags: taskTags.length > 0 ? taskTags : existingTask.taskTags || [],
      },
      this.errorFactory
    );
  }

  completeRequestToDomain(completeTaskRequest, existingTask) {
    return new this.Task(
      {
        ...existingTask.toJSON(),
        isCompleted: completeTaskRequest.isCompleted,
        updatedAt: new Date(),
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
    if (!rows || rows.length === 0) {
      return isSingle ? null : [];
    }

    const tasksMap = new Map();

    rows.forEach((row) => {
      let task = tasksMap.get(row.task_id);

      if (!task) {
        task = this.dbToDomain(row);
        tasksMap.set(row.task_id, task);
      }

      if (row.tag_id) {
        const taskTag = this.taskTagMapper.dbToDomain(row);
        if (task.addTaskTag) {
          task.addTaskTag(taskTag);
        } else {
          task.taskTags.push(taskTag);
        }
      }
    });

    const result = Array.from(tasksMap.values());
    return isSingle ? result[0] || null : result;
  }
}

module.exports = TaskMapper;
