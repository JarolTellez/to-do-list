class CreateTaskRequestDTO {
  constructor({ name, description, scheduledDate, priority, userId, taskTags }) {
    this.name = name;
    this.description = description;
    this.scheduledDate = scheduledDate;
    this.priority = priority;
    this.userId = userId;
    this.taskTags = taskTags || [];
  }
}

class UpdateTaskRequestDTO {
  constructor({ name, description, scheduledDate, priority, taskTags }) {
    this.name = name;
    this.description = description;
    this.scheduledDate = scheduledDate;
    this.priority = priority;
    this.taskTags = taskTags || [];
  }
}


class CompleteTaskRequestDTO {
  constructor({ isCompleted }) {
    this.isCompleted = isCompleted;
  }
}

module.exports={
CreateTaskRequestDTO,
UpdateTaskRequestDTO,
CompleteTaskRequestDTO
}