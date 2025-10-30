class TaskResponseDTO {
  constructor({ id, name, description, scheduledDate, createdAt, updatedAt, isCompleted, isOverdue, userId, priority, taskTags }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.scheduledDate = scheduledDate;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.isCompleted = isCompleted;
    this.isOverdue = isOverdue;
    this.userId = userId;
    this.priority = priority;
    this.taskTags = taskTags || [];
  }
}

class TasksSummaryResponseDTO {
    constructor({ pending, completed, overdue, total }) {
        this.pending = pending;
        this.completed = completed;
        this.overdue = overdue;
        this.total = total;
    }
}

module.exports={
  TaskResponseDTO,
  TasksSummaryResponseDTO
}