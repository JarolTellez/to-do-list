class CreateTaskRequestDTO {
  constructor({ name, description, scheduledDate, priority, userId, tags}) {
    this.name = name;
    this.description = description;
    this.scheduledDate = scheduledDate;
    this.priority = priority;
    this.userId = userId;
    this.tags=tags||[];
  }
}

class UpdateTaskRequestDTO {
  constructor({id, name, description, scheduledDate, priority, userId, tags }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.scheduledDate = scheduledDate;
    this.priority = priority;
    this.userId=userId;
    this.tags = tags || [];
  }
}


class CompleteTaskRequestDTO {
  constructor({ isCompleted, taskId, userId }) {
    this.taskId=taskId,
    this.userI=userId,
    this.isCompleted = isCompleted||true;
  
  }
}

module.exports={
CreateTaskRequestDTO,
UpdateTaskRequestDTO,
CompleteTaskRequestDTO
}