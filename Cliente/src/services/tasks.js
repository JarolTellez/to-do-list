import { apiClient } from "./api/clients/apiClient.js";
import { taskMappers } from "../mappers/taskMapper.js";
import { PaginationValidator } from "../utils/validators/paginationValidator.js";

class TaskService {
  async create(newTask) {
    const taskDTO = taskMappers.taskToCreateDTO(newTask);
    const response = await apiClient.api.post("/task/", taskDTO);

    const mappedTask = taskMappers.apiToTask(response.data);
    return { data: mappedTask, message: response.message };
  }

  async findAllByUserId(page, limit) {
    const validated = PaginationValidator.validateParams("TASKS", page, limit);
    const response = await apiClient.api.get("/task/", {
      params: {
        page: validated.page,
        limit: validated.limit,
      },
    });
    const mappedTasks = response.data.tasks?.map(taskMappers.apiToTask) || [];
    return {
      data: { tasks: mappedTasks, pagination: response.data.pagination },
      message: response.message,
    };
  }

  async complete(taskId, isCompleted) {
    const response = await apiClient.api.patch("/task/completion", {
      taskId: taskId,
      isCompleted: isCompleted,
    });
    return { data: response.data, message: response.message };
  }

  async update(updatedTask) {
    const updateDTO = taskMappers.taskToUpdateDTO(updatedTask);
    const response = await apiClient.api.patch("/task/update", updateDTO);

    const mappedTask = taskMappers.apiToTask(response.data);
    return { data: mappedTask, message: response.message };
  }

  async delete(taskId) {
    const response = await apiClient.api.delete("/task/", {
      data: {
        taskId: taskId,
      },
    });
    return { data: response.data, message: response.message };
  }
}

export const taskService = new TaskService();
