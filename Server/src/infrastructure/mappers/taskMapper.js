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
      taskTags: taskDomain.taskTags || [],
    });
  }

  domainToDetailResponse(taskDomain) {
    return new this.TaskDetailResponseDTO({
      task: this.domainToResponse(taskDomain),
      tags: taskDomain.getTags ? taskDomain.getTags() : [],
    });
  }
  toTasksSummary(pending, completed, overdue) {
    return new this.TasksSummaryResponseDTO({
      pending: pending,
      completed: completed,
      overdue: overdue,
      total: pending + completed,
    });
  }

  createRequestToDomain(createTaskRequest) {
    const taskTags = (createTaskRequest.tags || []).map((tag) =>
      this.tagMapper.requestToDomain(tag)
    );

    return this.Task.create(
      {
        name: createTaskRequest.name,
        description: createTaskRequest.description,
        scheduledDate: createTaskRequest.scheduledDate,
        priority: createTaskRequest.priority,
        userId: createTaskRequest.userId,
        taskTags: taskTags,
      },
      this.errorFactory
    );
  }

  updateRequestToDomain(updateTaskRequestDTO, existingTask) {
    const taskTags = (updateTaskRequestDTO.tags || []).map((tag) =>
      this.tagMapper.requestToDomain(tag)
    );

    return new this.Task(
      {
        id: updateTaskRequestDTO.id,
        name:
          updateTaskRequestDTO.name !== undefined
            ? updateTaskRequestDTO.name
            : existingTask.name,
        description:
          updateTaskRequestDTO.description !== undefined
            ? updateTaskRequestDTO.description
            : existingTask.description,
        scheduledDate:
          updateTaskRequestDTO.scheduledDate !== undefined
            ? this.dateParser.parseToDate(updateTaskRequestDTO.scheduledDate)
            : existingTask.scheduledDate,
        priority:
          updateTaskRequestDTO.priority !== undefined
            ? updateTaskRequestDTO.priority
            : existingTask.priority,
        isCompleted:
          updateTaskRequestDTO.isCompleted !== undefined
            ? updateTaskRequestDTO.isCompleted
            : existingTask.isCompleted,
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

  requestToDomain(taskRequest) {
     try {
      const taskTags = (taskRequest.tags || []).map((tag) => {
        return this.tagMapper.requestToDomain({
          ...tag,
          userId: tag.userId || taskRequest.userId,
        });
      });


      return new this.Task(
        {
          id: taskRequest.id || null,
          name: taskRequest.name,
          description: taskRequest.description || null,
          scheduledDate: taskRequest.scheduledDate ? 
            this.dateParser.parseToDate(taskRequest.scheduledDate) : null,
          createdAt: taskRequest.createdAt ? 
            this.dateParser.parseToDate(taskRequest.createdAt) : new Date(),
          updatedAt: taskRequest.updatedAt ? 
            this.dateParser.parseToDate(taskRequest.updatedAt) : new Date(),
          isCompleted: taskRequest.isCompleted || false,
          userId: taskRequest.userId,
          priority: taskRequest.priority || null,
          taskTags: taskTags, 
        },
        this.errorFactory
      );
    } catch (error) {
      throw new Error("Mapeo fallido: " + error.message);
    }
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
        const tag = this.tagMapper.dbToDomain(row);
        if (task.addTaskTag) {
          const taskTag = this.taskTagMapper.dbToDomain(row);
          task.addTaskTag(taskTag);
        } else {
          task.taskTags.push(tag);
        }
      }
    });

    const result = Array.from(tasksMap.values());
    return isSingle ? result[0] || null : result;
  }
}

module.exports = TaskMapper;
